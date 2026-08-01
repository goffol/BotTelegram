const SENSITIVE_KEYS = [
    "x-api-key",
    "api_key",
    "apikey",
    "authorization",
    "token",
    "telegram_bot_token",
    "upstream_api_key",
];
function redactValue(key, value) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((k) => lower.includes(k))) {
        return "[REDACTED]";
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return redactObject(value);
    }
    return value;
}
export function redactObject(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        out[k] = redactValue(k, v);
    }
    return out;
}
function formatMeta(meta) {
    if (meta === undefined)
        return "";
    try {
        if (meta && typeof meta === "object") {
            return " " + JSON.stringify(redactObject(meta));
        }
        return " " + String(meta);
    }
    catch {
        return " [unserializable meta]";
    }
}
function log(level, message, meta) {
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;
    if (level === "error") {
        console.error(line);
    }
    else if (level === "warn") {
        console.warn(line);
    }
    else {
        console.log(line);
    }
}
export const logger = {
    debug: (msg, meta) => log("debug", msg, meta),
    info: (msg, meta) => log("info", msg, meta),
    warn: (msg, meta) => log("warn", msg, meta),
    error: (msg, meta) => log("error", msg, meta),
};
//# sourceMappingURL=logger.js.map