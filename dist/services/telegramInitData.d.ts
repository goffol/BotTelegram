/**
 * Verify Telegram WebApp initData per official algorithm.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export declare function verifyTelegramInitData(initData: string, botToken: string, maxAgeSeconds?: number): {
    ok: true;
    userId: number;
    user?: Record<string, unknown>;
} | {
    ok: false;
    error: string;
};
