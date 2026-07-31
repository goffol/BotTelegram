type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = [
  "x-api-key",
  "api_key",
  "apikey",
  "authorization",
  "token",
  "telegram_bot_token",
  "upstream_api_key",
];

function redactValue(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.some((k) => lower.includes(k))) {
    return "[REDACTED]";
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

export function redactObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = redactValue(k, v);
  }
  return out;
}

function formatMeta(meta?: unknown): string {
  if (meta === undefined) return "";
  try {
    if (meta && typeof meta === "object") {
      return " " + JSON.stringify(redactObject(meta as Record<string, unknown>));
    }
    return " " + String(meta);
  } catch {
    return " [unserializable meta]";
  }
}

function log(level: LogLevel, message: string, meta?: unknown): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};
