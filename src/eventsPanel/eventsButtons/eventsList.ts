import { Interaction, EmbedBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleList(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const events = await EventStorage.getEvents(interaction.guildId!);

  const embed = new EmbedBuilder()
    .setTitle("Event List")
    .setDescription(
      events.length === 0
        ? "No events found."
        : events.map(e => `• ${e.name} (${e.status})`).join("\n")
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
