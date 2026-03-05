import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

// ✅ Importujemy funkcje z innych plików
import { handleCompareAll } from "./eventsCompare";
import { handleDownload } from "./eventsDownload";

export async function handleShowAllEvents(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  // 🔹 jeśli brak eventów – tylko ephemeral wiadomość, bez panelu
  if (!events.length) {
    await interaction.reply({
      content: "No events found.",
      ephemeral: true
    });
    return;
  }

  // 🔹 sortowanie chronologiczne
  const list = events
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(e => {
      const date = formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
      const statusEmoji = e.status === "ACTIVE" ? "🟢" : e.status === "PAST" ? "⚪" : "🔴";
      return `• ${statusEmoji} **${e.name}** — ${date} (${e.status})`;
    })
    .join("\n");

  // 🔹 przyciski Compare All i Download All – wywołują funkcje z innych plików
  const compareBtn = new ButtonBuilder()
    .setCustomId("compare_all_events")
    .setLabel("Compare All")
    .setStyle(ButtonStyle.Primary);

  const downloadBtn = new ButtonBuilder()
    .setCustomId("download_all_events")
    .setLabel("Download All")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(compareBtn, downloadBtn);

  await interaction.reply({
    content: `📅 **All Events**\n\n${list}`,
    components: [row],
    ephemeral: true
  });
}