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

// 🔥 NOWE: display value (obsługa RAID)
function getDisplayValue(entry: QuickAddEntry & { group?: string }) {
  if (entry.group === "MAIN") return "🟢 MAIN";
  if (entry.group === "RESERVE") return "🟡 RESERVE";

  if (entry.value !== undefined) return entry.value;

  return entry.raw;
}

export async function preview(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ No active session.");
    return;
  }

  const entries = SessionData.getEntries(guildId) as (QuickAddEntry & {
    group?: string;
  })[];

  if (!entries || entries.length === 0) {
    await message.reply("❌ No data to preview.");
    return;
  }

  // 🔥 LICZENIE DUPLIKATÓW
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const key = `${entry.nickname.toLowerCase()}_${entry.value}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const lines = entries.map((entry, index) => {
    const key = `${entry.nickname.toLowerCase()}_${entry.value}`;
    const count = counts.get(key) || 0;

    const duplicateMark = count > 1 ? ` ⚠ x${count}` : "";

    let statusMark = "";
    if (entry.status === "UNREADABLE") statusMark = " ⚠";
    if (entry.status === "INVALID") statusMark = " ❌";

    return `\`[${index + 1}]\` **${entry.nickname}** — ${getDisplayValue(
      entry
    )}${duplicateMark}${statusMark}`;
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