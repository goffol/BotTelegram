import crypto from "node:crypto";
import { logger } from "../utils/logger.js";

/**
 * Verify Telegram WebApp initData per official algorithm.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400,
): { ok: true; userId: number; user?: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return { ok: false, error: "Missing hash" };

    params.delete("hash");
    const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computed = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, error: "Invalid signature" };
    }

    const authDateRaw = params.get("auth_date");
    if (!authDateRaw) return { ok: false, error: "Missing auth_date" };
    const authDate = Number(authDateRaw);
    if (!Number.isFinite(authDate)) return { ok: false, error: "Invalid auth_date" };

    const age = Math.floor(Date.now() / 1000) - authDate;
    if (age > maxAgeSeconds) {
      return { ok: false, error: "initData expired" };
    }

    let userId = 0;
    let user: Record<string, unknown> | undefined;
    const userRaw = params.get("user");
    if (userRaw) {
      user = JSON.parse(userRaw) as Record<string, unknown>;
      if (typeof user.id === "number") userId = user.id;
    }

    if (!userId) return { ok: false, error: "Missing user id" };

    return { ok: true, userId, user };
  } catch (err) {
    logger.warn("initData verification failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "Verification error" };
  }
}
