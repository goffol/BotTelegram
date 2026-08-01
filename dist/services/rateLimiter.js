/**
 * In-memory sliding-window rate limiter keyed by Telegram user ID.
 * Suitable for single-process deploys; swap for Redis in multi-instance setups.
 */
export class RateLimiter {
    maxRequests;
    windowMs;
    hits = new Map();
    locks = new Set();
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    /** Returns remaining wait ms if limited, else 0 */
    check(userId) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        const prev = this.hits.get(userId) ?? [];
        const recent = prev.filter((t) => t > windowStart);
        this.hits.set(userId, recent);
        if (recent.length >= this.maxRequests) {
            const oldest = recent[0];
            return {
                allowed: false,
                retryAfterMs: Math.max(0, oldest + this.windowMs - now),
            };
        }
        return { allowed: true, retryAfterMs: 0 };
    }
    record(userId) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        const recent = (this.hits.get(userId) ?? []).filter((t) => t > windowStart);
        recent.push(now);
        this.hits.set(userId, recent);
    }
    /** Prevent concurrent change for same UID pair / user */
    tryAcquireLock(key) {
        if (this.locks.has(key))
            return false;
        this.locks.add(key);
        return true;
    }
    releaseLock(key) {
        this.locks.delete(key);
    }
    /** Periodic cleanup to avoid unbounded growth */
    sweep() {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        for (const [userId, times] of this.hits) {
            const recent = times.filter((t) => t > windowStart);
            if (recent.length === 0)
                this.hits.delete(userId);
            else
                this.hits.set(userId, recent);
        }
    }
}
//# sourceMappingURL=rateLimiter.js.map