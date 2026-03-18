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

  // 🔢 lista wpisów
  const lines = entries.map((entry, index) => {
    const valueFormatted =
      entry.value >= 1_000_000
        ? `${(entry.value / 1_000_000).toFixed(2)}M`
        : `${(entry.value / 1_000).toFixed(0)}K`;

    return `\`[${index + 1}]\` **${entry.nickname}** — ${valueFormatted}`;
  });

  const embed = new EmbedBuilder()
    .setTitle("📊 QuickAdd Preview – Reservoir Raid")
    .setDescription(
      `👤 **Session Owner:** <@${session.moderatorId}>\n` +
      `📦 **Entries:** ${entries.length}\n` +
      `────────────────\n` +
      lines.join("\n") +
      `\n────────────────\n` +
      `⚙️ **Commands:**\n` +
      `\`!preview\` – odświeża podgląd\n` +
      `\`!confirm\` – zapisuje dane i kończy sesję\n` +
      `\`!cancel\` – usuwa sesję bez zapisu\n` +
      `\`!adjust [id] [nick] [value]\` – popraw wpis\n` +
      `\`!repair [id]\` – próbuje naprawić wpis`
    )
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });
}