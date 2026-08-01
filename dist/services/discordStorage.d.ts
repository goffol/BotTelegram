export interface FlowRecord {
    uid: string;
    discordUserId: string;
    timestamp: number;
}
export declare function hasDiscordAccess(userId: string): Promise<boolean>;
export declare function grantDiscordAccess(userId: string): Promise<boolean>;
export declare function listDiscordAccess(): Promise<string[]>;
export declare function addFlowRecord(uid: string, discordUserId: string): Promise<void>;
export declare function getRecentFlowRecords(days?: number): Promise<FlowRecord[]>;
