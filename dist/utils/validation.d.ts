import { z } from "zod";
/** UID: alphanumeric, underscore, hyphen; length 3–64 */
export declare const uidSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const changeUidSchema: z.ZodEffects<z.ZodObject<{
    old_uid: z.ZodEffects<z.ZodString, string, string>;
    new_uid: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    old_uid: string;
    new_uid: string;
}, {
    old_uid: string;
    new_uid: string;
}>, {
    old_uid: string;
    new_uid: string;
}, {
    old_uid: string;
    new_uid: string;
}>;
export type ChangeUidInput = z.infer<typeof changeUidSchema>;
export declare function validateChangeUid(input: unknown): {
    ok: true;
    data: ChangeUidInput;
} | {
    ok: false;
    error: string;
};
