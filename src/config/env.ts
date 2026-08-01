import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10, "TELEGRAM_BOT_TOKEN is required"),
  UPSTREAM_API_KEY: z.string().min(1, "UPSTREAM_API_KEY is required"),
  ALLOWED_ADMIN_IDS: z
    .string()
    .optional()
    .default("")
    .transform((raw) =>
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const n = Number(s);
          if (!Number.isSafeInteger(n) || n <= 0) {
            throw new Error(`Invalid ALLOWED_ADMIN_IDS entry: ${s}`);
          }
          return n;
        }),
    ),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  MINI_APP_URL: z.string().url().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(3),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DISCORD_TOKEN: z.string().optional(),
  DISCORD_CHANNEL_ID: z.string().optional(),
  DISCORD_ADMIN_IDS: z
    .string()
    .optional()
    .default("")
    .transform((raw) => raw.split(",").map((s) => s.trim()).filter(Boolean)),
});

export type AppConfig = z.infer<typeof envSchema> & {
  UPSTREAM_API_URL: string;
};

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error("Invalid environment configuration:\n" + details);
  process.exit(1);
}

export const env: AppConfig = {
  ...parsed.data,
  UPSTREAM_API_URL:
    "https://gtccheats.xyz/Api/uidbypassapi/api_user.php?action=change_uid",
};
