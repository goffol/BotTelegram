import { InlineKeyboard } from "grammy";
import { env } from "../../config/env.js";
import { performChangeUid, addAllowedUser } from "../../services/changeUidService.js";
import { logger } from "../../utils/logger.js";
/** Per-user conversation state for multi-step UID change via chat */
const pending = new Map();
function helpText() {
    const lines = [
        "🔐 *UID Bypass Bot*",
        "",
        "Commands:",
        "• /start — welcome",
        "• /help — this message",
        "• /change — interactive UID change",
        "• /change \\<old\\> \\<new\\> — one-shot change",
        "• /add \\@username — (Admin) grant access",
        "• /cancel — cancel interactive flow",
        "• /status — rate-limit & access info",
        "",
        "UIDs: 8–15 chars, letters/numbers/`_`/`-` only.",
    ];
    if (env.MINI_APP_URL) {
        lines.push("", "Or open the Mini App from the menu button.");
    }
    return lines.join("\n");
}
export function registerHandlers(bot) {
    bot.command("start", async (ctx) => {
        const name = ctx.from?.first_name ?? "there";
        const kb = new InlineKeyboard();
        if (env.MINI_APP_URL) {
            kb.webApp("Open Mini App", env.MINI_APP_URL);
        }
        kb.text("Change UID", "flow:change").row().text("Help", "flow:help");
        await ctx.reply(`Welcome, *${name.replace(/[*_`]/g, "")}*!\n\n${helpText()}`, {
            parse_mode: "Markdown",
            reply_markup: kb,
        });
    });
    bot.command("help", async (ctx) => {
        await ctx.reply(helpText(), { parse_mode: "Markdown" });
    });
    bot.command("cancel", async (ctx) => {
        const id = ctx.from?.id;
        if (id)
            pending.delete(id);
        await ctx.reply("Cancelled.");
    });
    bot.command("status", async (ctx) => {
        const id = ctx.from?.id;
        await ctx.reply([
            `User ID: \`${id ?? "unknown"}\``,
            `Allowlist active: ${env.ALLOWED_ADMIN_IDS.length > 0 ? "yes" : "no (open)"}`,
            `Rate limit: ${env.RATE_LIMIT_MAX} req / ${env.RATE_LIMIT_WINDOW_MS / 1000}s`,
        ].join("\n"), { parse_mode: "Markdown" });
    });
    bot.command("add", async (ctx) => {
        const userId = ctx.from?.id;
        if (!userId || !env.ALLOWED_ADMIN_IDS.includes(userId)) {
            return ctx.reply("⛔ You don't have permission to use this command. Only admins in .env can add users.");
        }
        const parts = ctx.message?.text?.trim().split(/\s+/) || [];
        if (parts.length < 2) {
            return ctx.reply("Usage: `/add @username` or `/add <userid>`", { parse_mode: "Markdown" });
        }
        const target = parts[1];
        let parsedTarget = target;
        if (!target.startsWith("@")) {
            const num = Number(target);
            if (!isNaN(num))
                parsedTarget = num;
        }
        else {
            parsedTarget = target.toLowerCase();
        }
        addAllowedUser(parsedTarget);
        await ctx.reply(`✅ Added ${target} to the allowlist.`);
    });
    bot.command("change", async (ctx) => {
        const userId = ctx.from?.id;
        if (!userId)
            return;
        const text = ctx.message?.text ?? "";
        const parts = text.trim().split(/\s+/).slice(1);
        if (parts.length >= 2) {
            await runChange(ctx, userId, parts[0], parts[1]);
            return;
        }
        pending.set(userId, { step: "old" });
        await ctx.reply("Send the *current (old) UID*:", { parse_mode: "Markdown" });
    });
    bot.callbackQuery("flow:change", async (ctx) => {
        const userId = ctx.from.id;
        pending.set(userId, { step: "old" });
        await ctx.answerCallbackQuery();
        await ctx.reply("Send the *current (old) UID*:", { parse_mode: "Markdown" });
    });
    bot.callbackQuery("flow:help", async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply(helpText(), { parse_mode: "Markdown" });
    });
    bot.on("message:text", async (ctx, next) => {
        const userId = ctx.from?.id;
        if (!userId)
            return next();
        const state = pending.get(userId);
        if (!state)
            return next();
        // Ignore commands while in flow
        if (ctx.message.text.startsWith("/"))
            return next();
        const value = ctx.message.text.trim();
        if (state.step === "old") {
            pending.set(userId, { step: "new", old_uid: value });
            await ctx.reply("Send the *new UID*:", { parse_mode: "Markdown" });
            return;
        }
        if (state.step === "new" && state.old_uid) {
            pending.delete(userId);
            await runChange(ctx, userId, state.old_uid, value);
            return;
        }
        pending.delete(userId);
        return next();
    });
}
async function runChange(ctx, userId, oldUid, newUid) {
    const statusMsg = await ctx.reply("⏳ Processing UID change…");
    try {
        const result = await performChangeUid(userId, {
            old_uid: oldUid,
            new_uid: newUid,
        });
        const text = result.ok
            ? `✅ ${result.message}`
            : `❌ ${result.message}`;
        await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, text);
    }
    catch (err) {
        logger.error("Handler error during change", {
            message: err instanceof Error ? err.message : String(err),
        });
        await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, "❌ An internal error occurred. Please try again later.");
    }
}
//# sourceMappingURL=commands.js.map