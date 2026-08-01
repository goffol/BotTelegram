import { RateLimiter } from "./rateLimiter.js";
export declare const rateLimiter: RateLimiter;
export type ChangeUidServiceResult = {
    ok: true;
    message: string;
} | {
    ok: false;
    message: string;
    code: "validation" | "rate_limit" | "locked" | "upstream" | "auth";
};
export declare function addAllowedUser(user: string | number): void;
export declare function isUserAllowed(userId: number, username?: string): boolean;
export declare function performChangeUid(userId: number, raw: unknown): Promise<ChangeUidServiceResult>;
