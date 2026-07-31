import type { Context, NextFunction } from "grammy";
import { env } from "../../config/env.js";
import { isUserAllowed } from "../../services/changeUidService.js";

export async function authMiddleware(
  ctx: Context,
  next: NextFunction,
): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Unable to identify your Telegram account.");
    return;
  }

  if (env.ALLOWED_ADMIN_IDS.length > 0 && !isUserAllowed(userId, ctx.from?.username)) {
    await ctx.reply(
      "⛔ Access denied. Your Telegram ID is not on the allowlist.",
    );
    return;
  }

  await next();
}
