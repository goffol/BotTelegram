import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");

const ACCESS_FILE = path.join(dataDir, "discord_access.json");
const HISTORY_FILE = path.join(dataDir, "uid_history.json");

export interface FlowRecord {
  uid: string;
  discordUserId: string;
  timestamp: number;
}

async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export async function hasDiscordAccess(userId: string): Promise<boolean> {
  const users = await readJson<string[]>(ACCESS_FILE, []);
  return users.includes(userId);
}

export async function grantDiscordAccess(userId: string): Promise<boolean> {
  const users = await readJson<string[]>(ACCESS_FILE, []);
  if (!users.includes(userId)) {
    users.push(userId);
    await writeJson(ACCESS_FILE, users);
    return true;
  }
  return false;
}

export async function listDiscordAccess(): Promise<string[]> {
  return readJson<string[]>(ACCESS_FILE, []);
}

export async function addFlowRecord(uid: string, discordUserId: string) {
  const history = await readJson<FlowRecord[]>(HISTORY_FILE, []);
  history.push({ uid, discordUserId, timestamp: Date.now() });
  await writeJson(HISTORY_FILE, history);
}

export async function getRecentFlowRecords(days: number = 7): Promise<FlowRecord[]> {
  const history = await readJson<FlowRecord[]>(HISTORY_FILE, []);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return history.filter((r) => r.timestamp >= cutoff);
}
