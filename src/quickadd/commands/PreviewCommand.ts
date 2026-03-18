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

  // 🔢 lista wpisów (RAW VALUE)
  const lines = entries.map((entry, index) => {
    return `\`[${index + 1}]\` **${entry.nickname}** — ${entry.raw}`;
  });

  const embed = new EmbedBuilder()
    .setTitle("📊 QuickAdd Preview – Reservoir Raid")
    .setDescription(
      `👤 **Session Owner:** <@${session.moderatorId}>\n` +
      `📦 **Entries:** ${entries.length}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      lines.join("\n") +
      `\n━━━━━━━━━━━━━━━━━━\n` +
      `⚙️ **Commands:**\n` +
      `\`!preview\` – odświeża podgląd\n` +
      `\`!confirm\` – zapisuje i kończy sesję\n` +
      `\`!cancel\` – anuluje sesję (bez zapisu)\n` +
      `\`!adjust [id] nick [nowyNick]\` – zmienia nick\n` +
      `\`!adjust [id] value [nowaWartość]\` – zmienia wartość\n` +
      `📌 Przykład: \`!adjust 3 value 11.87M\``
    )
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });
}