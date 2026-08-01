import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function userFacingMessage(status, bodyMessage) {
    if (status === 401 || status === 403) {
        return "Authorization failed with the upstream service. Contact an administrator.";
    }
    if (status === 404) {
        return "Upstream endpoint not found. Contact an administrator.";
    }
    if (status === 429) {
        return "Upstream rate limit reached. Please try again later.";
    }
    if (status >= 500) {
        return "Upstream service is temporarily unavailable. Please try again shortly.";
    }
    if (bodyMessage && bodyMessage.length < 200) {
        // Prefer short safe messages from API if present
        return bodyMessage.replace(/api[_-]?key/gi, "[redacted]");
    }
    if (status >= 400) {
        return "Request was rejected. Check your UIDs and try again.";
    }
    return "Unexpected response from upstream service.";
}
function extractMessage(payload) {
    if (!payload || typeof payload !== "object")
        return undefined;
    const o = payload;
    for (const key of ["message", "msg", "error", "status", "detail"]) {
        const v = o[key];
        if (typeof v === "string" && v.trim())
            return v.trim();
    }
    return undefined;
}
function isSuccessPayload(status, payload) {
    if (status < 200 || status >= 300)
        return false;
    if (!payload || typeof payload !== "object")
        return status >= 200 && status < 300;
    const o = payload;
    if (typeof o.success === "boolean")
        return o.success;
    if (typeof o.status === "string") {
        const s = o.status.toLowerCase();
        if (s === "error" || s === "fail" || s === "failed")
            return false;
        if (s === "ok" || s === "success")
            return true;
    }
    if (typeof o.error === "string" && o.error.length > 0)
        return false;
    return true;
}
async function fetchOnce(input) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.UPSTREAM_TIMEOUT_MS);
    try {
        const res = await fetch(env.UPSTREAM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": env.UPSTREAM_API_KEY,
            },
            body: JSON.stringify({
                old_uid: input.old_uid,
                new_uid: input.new_uid,
            }),
            signal: controller.signal,
        });
        let payload;
        const text = await res.text();
        try {
            payload = text ? JSON.parse(text) : null;
        }
        catch {
            payload = { raw: text.slice(0, 500) };
        }
        const bodyMsg = extractMessage(payload);
        const success = isSuccessPayload(res.status, payload);
        if (success) {
            return {
                ok: true,
                status: res.status,
                message: bodyMsg ?? "UID change completed successfully.",
                data: payload,
            };
        }
        const retryable = res.status >= 500 || res.status === 429;
        return {
            ok: false,
            status: res.status,
            message: userFacingMessage(res.status, bodyMsg),
            retryable,
        };
    }
    catch (err) {
        const isAbort = err instanceof Error &&
            (err.name === "AbortError" || err.message.includes("aborted"));
        logger.error("Upstream API request failed", {
            name: err instanceof Error ? err.name : "unknown",
            message: err instanceof Error ? err.message : String(err),
        });
        return {
            ok: false,
            status: 0,
            message: isAbort
                ? "Upstream request timed out. Please try again."
                : "Network error reaching upstream service. Please try again.",
            retryable: true,
        };
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Change UID via upstream API with exponential backoff on transient failures.
 */
export async function changeUid(input) {
    let last;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        last = await fetchOnce(input);
        if (last.ok)
            return last;
        if (!last.retryable || attempt === MAX_RETRIES - 1)
            return last;
        const delay = BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 100);
        logger.warn("Retrying upstream API", { attempt: attempt + 1, delay });
        await sleep(delay);
    }
    return (last ?? {
        ok: false,
        status: 0,
        message: "Upstream request failed.",
        retryable: false,
    });
}
//# sourceMappingURL=uidApiClient.js.map