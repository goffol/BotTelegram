/**
 * In-memory sliding-window rate limiter keyed by Telegram user ID.
 * Suitable for single-process deploys; swap for Redis in multi-instance setups.
 */
export declare class RateLimiter {
    private readonly maxRequests;
    private readonly windowMs;
    private readonly hits;
    private readonly locks;
    constructor(maxRequests: number, windowMs: number);
    /** Returns remaining wait ms if limited, else 0 */
    check(userId: number): {
        allowed: boolean;
        retryAfterMs: number;
    };
    record(userId: number): void;
    /** Prevent concurrent change for same UID pair / user */
    tryAcquireLock(key: string): boolean;
    releaseLock(key: string): void;
    /** Periodic cleanup to avoid unbounded growth */
    sweep(): void;
}
