import { Client, GatewayIntentBits } from "discord.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { addUid } from "../services/uidApiClient.js";
import { hasDiscordAccess, grantDiscordAccess, listDiscordAccess, addFlowRecord, getRecentFlowRecords, } from "../services/discordStorage.js";
let client = null;
export async function startDiscordBot() {
    if (!env.DISCORD_TOKEN) {
        logger.info("Discord token not provided. Discord bot disabled.");
        return;
    }
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });
    client.on("clientReady", () => {
        logger.info(`Discord bot logged in as ${client?.user?.tag}`);
    });
    client.on("messageCreate", async (message) => {
        if (message.author.bot)
            return;
        // Restrict to specific channel if configured
        if (env.DISCORD_CHANNEL_ID && message.channelId !== env.DISCORD_CHANNEL_ID) {
            return;
        }
        const content = message.content.trim();
        if (!content.startsWith("!"))
            return;
        const args = content.split(/\s+/);
        const command = args[0].toLowerCase();
        try {
            if (command === "!adduid") {
                await handleAddUid(message, args);
            }
            else if (command === "!addakses") {
                await handleAddAkses(message);
            }
            else if (command === "!listakses") {
                await handleListAkses(message);
            }
            else if (command === "!flow") {
                await handleFlow(message);
            }
        }
        catch (err) {
            logger.error("Discord command error", { err: String(err) });
            await message.reply("❌ Terjadi kesalahan saat memproses command.");
        }
    });
    try {
        await client.login(env.DISCORD_TOKEN);
    }
    catch (err) {
        logger.error("Failed to start Discord bot", { err: String(err) });
    }
}
async function handleAddUid(message, args) {
    const userId = message.author.id;
    const isAdmin = env.DISCORD_ADMIN_IDS.includes(userId);
    const hasAccess = await hasDiscordAccess(userId);
    if (!isAdmin && !hasAccess) {
        await message.reply("❌ Kamu nggak punya akses buat pake command ini.");
        return;
    }
    const uid = args[1];
    if (!uid || !/^\d{8,15}$/.test(uid)) {
        await message.reply("❌ Format salah! Ketik: `!adduid <uid>`\nUID harus 8 - 15 angka.");
        return;
    }
    const replyMsg = await message.reply("⏳ Sedang memproses penambahan UID...");
    const res = await addUid(uid);
    if (res.ok) {
        await addFlowRecord(uid, userId);
        await replyMsg.edit(`✅ **BERHASIL!**\nUID \`${uid}\` sukses ditambah.`);
    }
    else {
        await replyMsg.edit(`❌ **GAGAL!**\nUID \`${uid}\` gagal ditambah.`);
    }
}
async function handleAddAkses(message) {
    const userId = message.author.id;
    if (!env.DISCORD_ADMIN_IDS.includes(userId)) {
        await message.reply("❌ Cuma admin yang bisa ngasih akses.");
        return;
    }
    const mentions = message.mentions.users;
    if (mentions.size === 0) {
        await message.reply("❌ Kamu harus tag orangnya. Contoh: `!addakses @user`");
        return;
    }
    const target = mentions.first();
    if (!target)
        return;
    const added = await grantDiscordAccess(target.id);
    if (added) {
        await message.reply(`✅ Sukses ngasih akses ke ${target.toString()} buat nambahin UID!`);
    }
    else {
        await message.reply(`⚠️ ${target.toString()} udah punya akses sebelumnya.`);
    }
}
async function handleListAkses(message) {
    const accessList = await listDiscordAccess();
    if (accessList.length === 0) {
        await message.reply("Belum ada user yang dikasih akses.");
        return;
    }
    const mentions = accessList.map((id) => `<@${id}>`).join("\n");
    await message.reply(`📜 **Daftar User Punya Akses:**\n${mentions}`);
}
async function handleFlow(message) {
    const records = await getRecentFlowRecords(7); // Last 7 days
    if (records.length === 0) {
        await message.reply("Belum ada UID yang ditambahin dalam 7 hari terakhir.");
        return;
    }
    // Format the output
    const lines = records.map((r) => {
        const date = new Date(r.timestamp).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        return `- \`${r.uid}\` (oleh <@${r.discordUserId}> pada ${date})`;
    });
    // Discord message limit is 2000 chars, chunk if necessary
    const fullText = `📊 **History Penambahan UID (7 Hari Terakhir):**\n${lines.join("\n")}`;
    if (fullText.length <= 2000) {
        await message.reply(fullText);
    }
    else {
        // Send as file if too long
        const buffer = Buffer.from(fullText, "utf-8");
        await message.reply({
            content: "📊 Data terlalu panjang, dikirim sebagai file.",
            files: [{ attachment: buffer, name: "flow_history.txt" }],
        });
    }
}
//# sourceMappingURL=bot.js.map