import { Message, EmbedBuilder } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

export async function preview(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  const entries = SessionData.getEntries(guildId);

  if (!entries || entries.length === 0) {
    await message.reply("❌ Brak danych do podglądu.");
    return;
  }

  // 🔥 LICZENIE DUPLIKATÓW
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const key = entry.nickname.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // 🔢 lista wpisów (RAW + DUPLICATE DETECTOR)
  const lines = entries.map((entry, index) => {
    const key = entry.nickname.toLowerCase();
    const count = counts.get(key) || 0;

    const duplicateMark =
      count > 1 ? ` ⚠ x${count}` : "";

    return `\`[${index + 1}]\` **${entry.nickname}** — ${entry.raw}${duplicateMark}`;
  });

  const embed = new EmbedBuilder()
    .setTitle("📊 QuickAdd Preview – Reservoir Raid")
    .setDescription(
      `👤 **Session Owner:** <@${session.moderatorId}>\n` +
        `📦 **Entries:** ${entries.length}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        lines.join("\n") +
        `\n━━━━━━━━━━━━━━━━━━\n` +
        `📌 Użyj \`!help\` aby zobaczyć dostępne komendy`
    )
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });
}