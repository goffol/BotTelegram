import type { ChangeUidInput } from "../utils/validation.js";
export type UidApiSuccess = {
    ok: true;
    status: number;
    message: string;
    data?: unknown;
};
export type UidApiFailure = {
    ok: false;
    status: number;
    message: string;
    retryable: boolean;
};
export type UidApiResult = UidApiSuccess | UidApiFailure;
/**
 * Change UID via upstream API with exponential backoff on transient failures.
 */
export declare function changeUid(input: ChangeUidInput): Promise<UidApiResult>;
/**
 * Add a new UID via the new SyntaxCorporation API.
 */
export declare function addUid(accountId: string): Promise<UidApiResult>;
