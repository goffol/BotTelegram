import { Bot } from "grammy";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { authMiddleware } from "./middleware/auth.js";
import { registerHandlers } from "./handlers/commands.js";

export function createBot(): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.use(async (ctx, next) => {
    const start = Date.now();
    try {
      await next();
    } finally {
      logger.debug("Update handled", {
        userId: ctx.from?.id,
        updateType: ctx.update.update_id,
        ms: Date.now() - start,
      });
    }
  });

  bot.use(authMiddleware);
  registerHandlers(bot);

  bot.catch((err) => {
    logger.error("Bot unhandled error", {
      message: err.error instanceof Error ? err.error.message : String(err.error),
    });
  });

  return bot;
}
