import { TextChannel, EmbedBuilder } from "discord.js";

export async function sendSessionInfo(
  channel: TextChannel,
  moderatorId: string
) {
  const embed = new EmbedBuilder()
    .setTitle("🧾 Kanał sesji")
    .setDescription(
      `👤 **Moderator:** <@${moderatorId}>\n\n` +

      `📌 To jest kanał roboczy do wprowadzania danych.\n\n` +

      `✏️ Wpisuj dane w formacie:\n` +
      `\`nick wartość\`\n\n` +

      `📌 Przykład:\n` +
      `\`Shadow 12.5M\`\n\n` +

      `━━━━━━━━━━━━━━━━━━\n` +
      `ℹ️ Użyj \`!help\`, aby zobaczyć dostępne komendy`
    )
    .setColor(0xf1c40f);

  const msg = await channel.send({ embeds: [embed] });

  await msg.pin().catch(() => {});
}