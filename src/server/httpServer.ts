import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { performChangeUid, isUserAllowed } from "../services/changeUidService.js";
import { verifyTelegramInitData } from "../services/telegramInitData.js";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "../../frontend");

export function createHttpServer() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  // Static Mini App
  app.use(express.static(frontendRoot));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "rxkinguid-bot" });
  });

  /**
   * Mini App API: change UID
   * Requires Telegram WebApp initData in X-Telegram-Init-Data header
   */
  app.post("/api/change-uid", async (req, res) => {
    try {
      const initData =
        (req.header("X-Telegram-Init-Data") ||
          req.header("x-telegram-init-data") ||
          "") as string;

      if (!initData) {
        res.status(401).json({
          ok: false,
          message: "Missing Telegram init data.",
        });
        return;
      }

      const verified = verifyTelegramInitData(
        initData,
        env.TELEGRAM_BOT_TOKEN,
      );

      if (!verified.ok) {
        res.status(401).json({
          ok: false,
          message: "Invalid or expired Telegram session.",
        });
        return;
      }

      const username = verified.user && typeof verified.user.username === "string" 
        ? verified.user.username 
        : undefined;

      if (!isUserAllowed(verified.userId, username)) {
        res.status(403).json({
          ok: false,
          message: "You are not authorized to use this service.",
        });
        return;
      }

      const result = await performChangeUid(verified.userId, {
        old_uid: req.body?.old_uid,
        new_uid: req.body?.new_uid,
      });

      const status =
        result.ok
          ? 200
          : result.code === "validation"
            ? 400
            : result.code === "rate_limit" || result.code === "locked"
              ? 429
              : result.code === "auth"
                ? 403
                : 502;

      if (status === 429) {
        res.setHeader("Retry-After", "60");
      }

      res.status(status).json({
        ok: result.ok,
        message: result.message,
      });
    } catch (err) {
      logger.error("HTTP /api/change-uid error", {
        message: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        ok: false,
        message: "Internal server error.",
      });
    }
  });

  // SPA fallback for Mini App
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendRoot, "index.html"));
  });

  return app;
}

export function startHttpServer(): void {
  const app = createHttpServer();
  app.listen(env.PORT, env.HOST, () => {
    logger.info(`HTTP server listening on http://${env.HOST}:${env.PORT}`);
  });
}
