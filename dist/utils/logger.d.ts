export declare function redactObject(obj: Record<string, unknown>): Record<string, unknown>;
export declare const logger: {
    debug: (msg: string, meta?: unknown) => void;
    info: (msg: string, meta?: unknown) => void;
    warn: (msg: string, meta?: unknown) => void;
    error: (msg: string, meta?: unknown) => void;
};
