import { z } from "zod";
/** UID: alphanumeric, underscore, hyphen; length 3–64 */
export const uidSchema = z
    .string()
    .trim()
    .min(8, "UID must be at least 8 characters")
    .max(15, "UID must be at most 15 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "UID may only contain letters, numbers, underscore, and hyphen")
    .refine((v) => !/(--|\/\*|\*\/|;|'|"|<|>|`|\$\(|\b(select|drop|union|insert|script)\b)/i.test(v), "UID contains disallowed patterns");
export const changeUidSchema = z
    .object({
    old_uid: uidSchema,
    new_uid: uidSchema,
})
    .refine((d) => d.old_uid !== d.new_uid, {
    message: "old_uid and new_uid must be different",
    path: ["new_uid"],
});
export function validateChangeUid(input) {
    const result = changeUidSchema.safeParse(input);
    if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join("; ");
        return { ok: false, error: msg };
    }
    return { ok: true, data: result.data };
}
//# sourceMappingURL=validation.js.map