import { env } from "./config/env.js";
import { createBot } from "./bot/createBot.js";
import { startHttpServer } from "./server/httpServer.js";
import { startDiscordBot } from "./discord/bot.js";
import { logger } from "./utils/logger.js";
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Promise Rejection", {
        reason: reason instanceof Error ? reason.message : String(reason),
    });
});
process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", {
        message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
});
async function main() {
    logger.info("Starting RXKINGUID bot", {
        nodeEnv: env.NODE_ENV,
        allowlistSize: env.ALLOWED_ADMIN_IDS.length,
        rateLimit: `${env.RATE_LIMIT_MAX}/${env.RATE_LIMIT_WINDOW_MS}ms`,
    });
    if (env.ALLOWED_ADMIN_IDS.length === 0) {
        logger.warn("ALLOWED_ADMIN_IDS is empty — all Telegram users can use the bot. Set an allowlist for production.");
    }
    startHttpServer();
    try {
        await startDiscordBot();
        logger.info("Discord bot started");
    }
    catch (err) {
        logger.error("Failed to start Discord bot", { err: String(err) });
    }
    const bot = createBot();
    // Clear any leftover webhook so long polling can take over cleanly
    try {
        await bot.api.deleteWebhook({ drop_pending_updates: true });
    }
    catch (err) {
        logger.warn("Failed to delete Telegram webhook", { err: String(err) });
    }
    if (env.MINI_APP_URL) {
        await bot.api.setChatMenuButton({
            menu_button: {
                type: "web_app",
                text: "UID App",
                web_app: { url: env.MINI_APP_URL },
            },
        });
        logger.info("Mini App menu button set", { url: env.MINI_APP_URL });
    }
    try {
        await bot.start({
            onStart: (info) => {
                logger.info(`Bot @${info.username} is running (long polling)`);
            },
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // 409 = another process is already polling this bot token
        if (message.includes("409") || /Conflict/i.test(message)) {
            logger.error("Telegram bot conflict (409): another instance is already running with this TELEGRAM_BOT_TOKEN. Stop the other process (VPS/PM2/terminal lain). Discord + HTTP tetap jalan.", { message });
            return;
        }
        throw err;
    }
}
main().catch((err) => {
    logger.error("Fatal startup error", {
        message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
});
//# sourceMappingURL=index.js.map