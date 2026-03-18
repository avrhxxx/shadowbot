import { TextChannel, EmbedBuilder } from "discord.js";

export async function sendSessionInfo(
  channel: TextChannel,
  moderatorId: string,
  mode: "add" | "attend"
) {
  const description =
    mode === "add"
      ? "W tym kanale dodajesz dane do eventu.\n\nFormat:\n`nick 100k`"
      : "W tym kanale zaznaczasz obecność.\n\nFormat:\n`nick`";

  const embed = new EmbedBuilder()
    .setTitle("📌 Informacja o kanale")
    .setDescription(
      `👤 **Moderator:** <@${moderatorId}>\n\n` +
      `${description}\n\n` +
      `💡 Wpisz \`!help\`, aby zobaczyć dostępne komendy`
    )
    .setColor(0x5865f2);

  await channel.send({ embeds: [embed] });
}