// src/quickadd/commands/PreviewCommand.ts
import { Message, EmbedBuilder } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";
import { QuickAddEntry } from "../types/QuickAddEntry";

function getTitle(parserType: string | null) {
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
      return "Auto Detect";
  }
}

function getGroupLabel(entry: any): string {
  if (entry.group === "MAIN") return "🟢 MAIN";
  if (entry.group === "RESERVE") return "🟡 RESERVE";
  return "";
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

  // 🔥 DUPLIKATY
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const key = entry.nickname.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const lines = entries.map((entry, index) => {
    const key = entry.nickname.toLowerCase();
    const count = counts.get(key) || 0;

    const duplicateMark = count > 1 ? ` ⚠ x${count}` : "";

    let statusMark = "";
    if (entry.status === "UNREADABLE") statusMark = " ⚠";
    if (entry.status === "INVALID") statusMark = " ❌";

    const groupLabel = getGroupLabel(entry);

    return `\`[${index + 1}]\` **${entry.nickname}**${
      groupLabel ? ` — ${groupLabel}` : ""
    }${duplicateMark}${statusMark}`;
  });

  // 🔥 LIMIT (bez crasha Discorda)
  const MAX_LINES = 50;
  const visibleLines = lines.slice(0, MAX_LINES);

  const truncated =
    lines.length > MAX_LINES
      ? `\n… and ${lines.length - MAX_LINES} more`
      : "";

  const embed = new EmbedBuilder()
    .setTitle(`📊 ${getTitle(session.parserType)} Preview`)
    .setDescription(
      `📦 **Entries:** ${entries.length}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        visibleLines.join("\n") +
        truncated +
        `\n━━━━━━━━━━━━━━━━━━\n` +
        `💡 \`!confirm\` • \`!adjust\` • \`!delete\` • \`!cancel\``
    )
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });
}