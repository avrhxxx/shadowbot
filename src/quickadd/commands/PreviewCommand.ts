// src/quickadd/commands/PreviewCommand.ts

import { Message, EmbedBuilder } from "discord.js";

// ✅ FIX
import { SessionStore } from "../session/sessionStore";

import { QuickAddEntry } from "../types/QuickAddEntry";

// =====================================
// 🔹 HELPERS
// =====================================
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

// =====================================
// 🔹 PREVIEW COMMAND
// =====================================
export async function preview(message: Message) {
  const guildId = message.guildId!;
  const session = SessionStore.getSession(guildId);

  console.log("=================================");
  console.log("📊 PREVIEW COMMAND START");
  console.log("=================================");

  if (!session) {
    console.log("❌ No active session");
    await message.reply("❌ No active session.");
    return;
  }

  console.log("🧠 Session parserType:", session.parserType);

  // ✅ FIX
  const entries = SessionStore.getEntries(guildId) as QuickAddEntry[];

  if (!entries || entries.length === 0) {
    console.log("❌ No entries in session");
    await message.reply("❌ No data to preview.");
    return;
  }

  console.log(`📦 Entries count: ${entries.length}`);

  // =====================================
  // 🔥 FULL DEBUG DUMP
  // =====================================
  console.log("=================================");
  console.log("📥 RAW ENTRIES DUMP");
  console.log("=================================");

  entries.forEach((e, i) => {
    console.log(
      `[${i}] nick="${e.nickname}" value=${e.value} status=${(e as any).status} raw="${e.raw}"`
    );
  });

  // =====================================
  // 🔁 DUPLICATE DETECTION
  // =====================================
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const key = entry.nickname.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  console.log("=================================");
  console.log("🔁 DUPLICATE CHECK");
  console.log("=================================");

  counts.forEach((count, nick) => {
    if (count > 1) {
      console.log(`⚠ DUPLICATE: ${nick} x${count}`);
    }
  });

  // =====================================
  // 🔹 BUILD PREVIEW LINES
  // =====================================
  const lines = entries.map((entry, index) => {
    const key = entry.nickname.toLowerCase();
    const count = counts.get(key) || 0;

    const duplicateMark = count > 1 ? ` ⚠ x${count}` : "";

    let statusMark = "";
    if ((entry as any).status === "UNREADABLE") statusMark = " ⚠";
    if ((entry as any).status === "INVALID") statusMark = " ❌";

    const groupLabel = getGroupLabel(entry);

    // 🔥 FORMAT VALUE
    const formattedValue =
      typeof entry.value === "number"
        ? entry.value.toLocaleString("en-US")
        : entry.value ?? "—";

    return `\`[${index + 1}]\` **${entry.nickname}** → ${formattedValue}${
      groupLabel ? ` — ${groupLabel}` : ""
    }${duplicateMark}${statusMark}`;
  });

  // =====================================
  // 🔥 LIMIT (discord safe)
  // =====================================
  const MAX_LINES = 50;
  const visibleLines = lines.slice(0, MAX_LINES);

  const truncated =
    lines.length > MAX_LINES
      ? `\n… and ${lines.length - MAX_LINES} more`
      : "";

  const description =
    `📦 **Entries:** ${entries.length}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    visibleLines.join("\n") +
    truncated +
    `\n━━━━━━━━━━━━━━━━━━\n` +
    `💡 \`!confirm\` • \`!adjust\` • \`!delete\` • \`!cancel\``;

  // =====================================
  // 🔥 FINAL DEBUG OUTPUT
  // =====================================
  console.log("=================================");
  console.log("🧾 PREVIEW DESCRIPTION");
  console.log("=================================");
  console.log(description);

  const embed = new EmbedBuilder()
    .setTitle(`📊 ${getTitle(session.parserType)} Preview`)
    .setDescription(description)
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });

  console.log("=================================");
  console.log("✅ PREVIEW SENT");
  console.log("=================================");
}