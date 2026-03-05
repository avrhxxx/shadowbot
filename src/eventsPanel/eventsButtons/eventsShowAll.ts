import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

export async function handleShowAllEvents(interaction: ButtonInteraction) {

  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  if (!events.length) {
    await interaction.reply({
      content: "No events found.",
      ephemeral: true
    });
    return;
  }

  const list = events
    .sort((a,b)=>a.createdAt-b.createdAt)
    .map(e => {

      const date = formatEventUTC(
        e.day,
        e.month,
        e.hour,
        e.minute,
        e.year
      );

      return `• **${e.name}** — ${date} (${e.status})`;

    })
    .join("\n");

  const compareBtn = new ButtonBuilder()
    .setCustomId("compare_all_events")
    .setLabel("Compare All")
    .setStyle(ButtonStyle.Primary);

  const downloadBtn = new ButtonBuilder()
    .setCustomId("download_all_events")
    .setLabel("Download All")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(compareBtn, downloadBtn);

  await interaction.reply({
    content: `📅 **All Events**\n\n${list}`,
    components: [row],
    ephemeral: true
  });
}