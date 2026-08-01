import { z } from "zod";
declare const envSchema: z.ZodObject<{
    TELEGRAM_BOT_TOKEN: z.ZodString;
    UPSTREAM_API_KEY: z.ZodString;
    ALLOWED_ADMIN_IDS: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number[], string | undefined>;
    PORT: z.ZodDefault<z.ZodNumber>;
    HOST: z.ZodDefault<z.ZodString>;
    MINI_APP_URL: z.ZodOptional<z.ZodString>;
    RATE_LIMIT_MAX: z.ZodDefault<z.ZodNumber>;
    RATE_LIMIT_WINDOW_MS: z.ZodDefault<z.ZodNumber>;
    UPSTREAM_TIMEOUT_MS: z.ZodDefault<z.ZodNumber>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    DISCORD_TOKEN: z.ZodOptional<z.ZodString>;
    DISCORD_CHANNEL_ID: z.ZodOptional<z.ZodString>;
    DISCORD_ADMIN_IDS: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, string[], string | undefined>;
}, "strip", z.ZodTypeAny, {
    TELEGRAM_BOT_TOKEN: string;
    UPSTREAM_API_KEY: string;
    ALLOWED_ADMIN_IDS: number[];
    PORT: number;
    HOST: string;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW_MS: number;
    UPSTREAM_TIMEOUT_MS: number;
    NODE_ENV: "development" | "production" | "test";
    DISCORD_ADMIN_IDS: string[];
    MINI_APP_URL?: string | undefined;
    DISCORD_TOKEN?: string | undefined;
    DISCORD_CHANNEL_ID?: string | undefined;
}, {
    TELEGRAM_BOT_TOKEN: string;
    UPSTREAM_API_KEY: string;
    ALLOWED_ADMIN_IDS?: string | undefined;
    PORT?: number | undefined;
    HOST?: string | undefined;
    MINI_APP_URL?: string | undefined;
    RATE_LIMIT_MAX?: number | undefined;
    RATE_LIMIT_WINDOW_MS?: number | undefined;
    UPSTREAM_TIMEOUT_MS?: number | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    DISCORD_TOKEN?: string | undefined;
    DISCORD_CHANNEL_ID?: string | undefined;
    DISCORD_ADMIN_IDS?: string | undefined;
}>;
export type AppConfig = z.infer<typeof envSchema> & {
    UPSTREAM_API_URL: string;
};
export declare const env: AppConfig;
export {};
