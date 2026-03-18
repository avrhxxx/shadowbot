import { Message, EmbedBuilder } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

export async function preview(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) return;

  const entries = SessionData.getEntries(guildId);

  if (!entries || entries.length === 0) {
    await message.reply("❌ Brak danych.");
    return;
  }

  // 🔢 budowanie listy
  const lines = entries.map((entry, index) => {
    const valueFormatted =
      entry.value >= 1_000_000
        ? `${(entry.value / 1_000_000).toFixed(2)}M`
        : `${(entry.value / 1_000).toFixed(0)}K`;

    const status = entry.status ?? "OK";

    return `**[${index + 1}] ${entry.nickname}** – ${valueFormatted} | \`${status}\``;
  });

  // 📊 suma
  const total = entries.reduce((sum, e) => sum + e.value, 0);
  const totalFormatted =
    total >= 1_000_000
      ? `${(total / 1_000_000).toFixed(2)}M`
      : `${(total / 1_000).toFixed(0)}K`;

  // 🎨 embed
  const embed = new EmbedBuilder()
    .setTitle("📊 QuickAdd Preview – Reservoir Raid")
    .setDescription(lines.join("\n"))
    .addFields(
      {
        name: "👤 Moderator",
        value: `<@${session.moderatorId}>`,
        inline: true,
      },
      {
        name: "📦 Entries",
        value: `${entries.length}`,
        inline: true,
      },
      {
        name: "💰 Total",
        value: totalFormatted,
        inline: true,
      },
      {
        name: "⚙️ Commands",
        value:
          "`!adjust [id] [nick] [value]`\n" +
          "`!repair [id]`\n" +
          "`!redo`\n" +
          "`!confirm`\n" +
          "`!cancel`",
      }
    )
    .setColor(0x00bfff);

  await message.reply({ embeds: [embed] });
}