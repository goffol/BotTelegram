import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { validateChangeUid } from "../utils/validation.js";
import { RateLimiter } from "./rateLimiter.js";
import { changeUid } from "./uidApiClient.js";

export const rateLimiter = new RateLimiter(
  env.RATE_LIMIT_MAX,
  env.RATE_LIMIT_WINDOW_MS,
);

// Sweep every minute
setInterval(() => rateLimiter.sweep(), 60_000).unref?.();

export type ChangeUidServiceResult =
  | { ok: true; message: string }
  | { ok: false; message: string; code: "validation" | "rate_limit" | "locked" | "upstream" | "auth" };

const allowedUsersFile = path.resolve(process.cwd(), "allowed_users.json");
let addedUsers: Set<string | number> = new Set();

try {
  if (fs.existsSync(allowedUsersFile)) {
    const data = JSON.parse(fs.readFileSync(allowedUsersFile, "utf-8"));
    addedUsers = new Set(data);
  }
} catch (e) {
  logger.error("Failed to load allowed_users.json");
}

export function addAllowedUser(user: string | number) {
  addedUsers.add(user);
  fs.writeFileSync(allowedUsersFile, JSON.stringify(Array.from(addedUsers)), "utf-8");
}

export function isUserAllowed(userId: number, username?: string): boolean {
  if (env.ALLOWED_ADMIN_IDS.length === 0) {
    return true;
  }
  if (env.ALLOWED_ADMIN_IDS.includes(userId)) return true;
  if (addedUsers.has(userId)) return true;
  if (username && addedUsers.has(username.toLowerCase())) return true;
  if (username && addedUsers.has(`@${username.toLowerCase()}`)) return true;
  return false;
}

export async function performChangeUid(
  userId: number,
  raw: unknown,
): Promise<ChangeUidServiceResult> {
  if (!isUserAllowed(userId, raw && typeof raw === "object" && "username" in raw ? String(raw.username) : undefined)) {
    return {
      ok: false,
      message: "You are not authorized to use this service.",
      code: "auth",
    };
  }

  const validated = validateChangeUid(raw);
  if (!validated.ok) {
    return { ok: false, message: validated.error, code: "validation" };
  }

  const { data } = validated;
  const rl = rateLimiter.check(userId);
  if (!rl.allowed) {
    const secs = Math.ceil(rl.retryAfterMs / 1000);
    return {
      ok: false,
      message: `Rate limit exceeded. Try again in ~${secs}s.`,
      code: "rate_limit",
    };
  }

  const lockKey = String(userId);
  if (!rateLimiter.tryAcquireLock(lockKey)) {
    return {
      ok: false,
      message: "A similar request is already in progress. Please wait.",
      code: "locked",
    };
  }

  try {
    rateLimiter.record(userId);
    logger.info("UID change requested", {
      userId,
      old_uid_len: data.old_uid.length,
      new_uid_len: data.new_uid.length,
    });

    const result = await changeUid(data);
    if (result.ok) {
      return { ok: true, message: result.message };
    }
    return { ok: false, message: result.message, code: "upstream" };
  } finally {
    rateLimiter.releaseLock(lockKey);
  }
}
