// src/absencePanel/absenceNotification.ts
import { TextChannel, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message } from "discord.js";
import { getAbsences, removeAbsence } from "../absencePanel/absenceService";
import { setNotificationChannel, getAbsenceConfig } from "../absencePanel/absenceService";
import cron from "node-cron";

// -----------------------------
// SETTINGS
// -----------------------------
const NOTIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h
let pinnedMessageCache: Record<string, string> = {}; // guildId -> messageId

// -----------------------------
// UTILS
// -----------------------------
function formatAbsence(absence: any) {
  return `${absence.player}: ${absence.startDate} → ${absence.endDate}`;
}

function createEmbed(absences: any[]) {
  const embed = new EmbedBuilder()
    .setTitle("📌 Current Absences")
    .setColor(0x1E90FF)
    .setTimestamp(Date.now())
    .setDescription(absences.length === 0 ? "✅ No absences recorded." :
      absences.map(a => formatAbsence(a)).join("\n")
    );
  return embed;
}

// -----------------------------
// GET OR CREATE EMBED
// -----------------------------
async function getPinnedEmbed(channel: TextChannel): Promise<Message> {
  const config = await getAbsenceConfig(channel.guildId!);
  let messageId = config.absenceEmbedMessageId || pinnedMessageCache[channel.guildId!];
  let message: Message | undefined;

  if (messageId) {
    try {
      message = await channel.messages.fetch(messageId);
    } catch { message = undefined; }
  }

  if (!message) {
    // send new embed and pin it
    const absences = await getAbsences(channel.guildId!);
    message = await channel.send({ embeds: [createEmbed(absences)] });
    await message.pin().catch(() => {});
    pinnedMessageCache[channel.guildId!] = message.id;
    await setNotificationChannel(channel.guildId!, message.id); // zapis ID do config
  }

  return message;
}

// -----------------------------
// UPDATE EMBED
// -----------------------------
export async function updateAbsenceEmbed(channel: TextChannel) {
  const message = await getPinnedEmbed(channel);
  const absences = await getAbsences(channel.guildId!);

  await message.edit({ embeds: [createEmbed(absences)] });
}

// -----------------------------
// SEND NOTIFICATION
// -----------------------------
export async function sendAbsenceNotification(channel: TextChannel, player: string, startDate: string, endDate: string) {
  const content = `📢 Player **${player}** will be absent from **${startDate} → ${endDate}**`;
  const msg = await channel.send({ content });

  // automatyczne usuwanie po 24h
  setTimeout(async () => {
    try { await msg.delete(); } catch {}
  }, NOTIFICATION_EXPIRY_MS);
}

// -----------------------------
// MANUAL ADD/REMOVE HANDLERS
// -----------------------------
export async function handleAddAbsenceNotification(channel: TextChannel, player: string, startDate: string, endDate: string) {
  await updateAbsenceEmbed(channel);
  await sendAbsenceNotification(channel, player, startDate, endDate);
}

export async function handleRemoveAbsenceNotification(channel: TextChannel, player: string) {
  const content = `🗑️ Player **${player}** absence has been removed`;
  await channel.send({ content });
  await updateAbsenceEmbed(channel);
}

// -----------------------------
// CRON: AUTO CLEANER
// -----------------------------
export function startAbsenceCron() {
  // sprawdzamy co godzinę
  cron.schedule("0 * * * *", async () => {
    const allConfigs = await getAllGuildConfigs(); // funkcja, która zwraca wszystkie guildId i notificationChannel
    for (const config of allConfigs) {
      const channelId = config.notificationChannel;
      const guildId = config.guildId;
      if (!channelId) continue;

      const channel = await globalClient.channels.fetch(channelId) as TextChannel;
      if (!channel) continue;

      const absences = await getAbsences(guildId);
      const now = new Date();
      for (const absence of absences) {
        const [fromDay, fromMonth] = absence.startDate.split("/").map(Number);
        const [toDay, toMonth] = absence.endDate.split("/").map(Number);
        const toDate = new Date(now.getFullYear(), toMonth - 1, toDay);
        if (toDate < now) {
          await removeAbsence(guildId, absence.player);
          await sendAbsenceNotification(channel, absence.player, absence.startDate, absence.endDate);
        }
      }

      await updateAbsenceEmbed(channel);
    }
  });
}

// -----------------------------
// MOCK: GET ALL CONFIGS
// -----------------------------
async function getAllGuildConfigs(): Promise<{ guildId: string, notificationChannel: string }[]> {
  // powinno zwracać wszystkie guildy i ustawiony channel z absencji
  // TODO: zamienić na prawdziwy serwis
  return []; 
}

// -----------------------------
// GLOBAL CLIENT
// -----------------------------
let globalClient: any;
export function setGlobalClient(client: any) {
  globalClient = client;
}