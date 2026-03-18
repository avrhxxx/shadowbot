import { Message, EmbedBuilder } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";
import { QuickAddEntry } from "../types/QuickAddEntry";

function getTitle(parserType: string) {
  switch (parserType) {
    case "RR_RAID":
      return "Reservoir Raid";
    case "RR_ATTENDANCE":
      return "Reservoir Attendance";
    case "DONATIONS":
      return "Donations";
    case "DUEL_POINTS":
      return "Duel Points";
    default:
      return "QuickAdd";
  }
}

export async function preview(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ No active session.");
    return;
  }

  const entries = SessionData.getEntries(guildId) as QuickAddEntry[];

  if (!entries || entries.length === 0) {
    await message.reply("❌ No data to preview.");
    return;
  }

  // 🔥 DUPLICATES
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const key = entry.nickname.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // 🔥 LISTA
  const lines = entries.map((entry, index) => {
    const key = entry.nickname.toLowerCase();
    const count = counts.get(key) || 0;

    const duplicateMark = count > 1 ? ` ⚠ x${count}` : "";

    const statusMark =
      entry.status === "UNREADABLE"
        ? " ⚠ OCR?"
        : entry.status === "INVALID"
        ? " ❌"
        : "";

    return `\`[${index + 1}]\` **${entry.nickname}** — ${
      entry.value ?? entry.raw
    }${duplicateMark}${statusMark}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`📊 QuickAdd Preview – ${getTitle(session.parserType)}`)
    .setDescription(
      `👤 **Session Owner:** <@${session.moderatorId}>\n` +
        `📦 **Entries:** ${entries.length}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        lines.join("\n") +
        `\n━━━━━━━━━━━━━━━━━━\n` +
        `📌 Use \`!help\` to see available commands`
    )
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });
}