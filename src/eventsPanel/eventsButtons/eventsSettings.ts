import { ButtonInteraction, StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleSettings(interaction: ButtonInteraction) {
  const channels = interaction.guild!.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (channels.length === 0) {
    await interaction.reply({ content: "No text channels available.", ephemeral: true });
    return;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("event_settings_select")
    .setPlaceholder("Select global channel")
    .addOptions(channels);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({ content: "Select default global channel:", components: [row], ephemeral: true });
}