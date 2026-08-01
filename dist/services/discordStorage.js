import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");
const ACCESS_FILE = path.join(dataDir, "discord_access.json");
const HISTORY_FILE = path.join(dataDir, "uid_history.json");
async function ensureDataDir() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
    }
    catch { }
}
async function readJson(file, fallback) {
    try {
        const data = await fs.readFile(file, "utf-8");
        return JSON.parse(data);
    }
    catch {
        return fallback;
    }
}
async function writeJson(file, data) {
    await ensureDataDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}
export async function hasDiscordAccess(userId) {
    const users = await readJson(ACCESS_FILE, []);
    return users.includes(userId);
}
export async function grantDiscordAccess(userId) {
    const users = await readJson(ACCESS_FILE, []);
    if (!users.includes(userId)) {
        users.push(userId);
        await writeJson(ACCESS_FILE, users);
        return true;
    }
    return false;
}
export async function listDiscordAccess() {
    return readJson(ACCESS_FILE, []);
}
export async function addFlowRecord(uid, discordUserId) {
    const history = await readJson(HISTORY_FILE, []);
    history.push({ uid, discordUserId, timestamp: Date.now() });
    await writeJson(HISTORY_FILE, history);
}
export async function getRecentFlowRecords(days = 7) {
    const history = await readJson(HISTORY_FILE, []);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter((r) => r.timestamp >= cutoff);
}
//# sourceMappingURL=discordStorage.js.map