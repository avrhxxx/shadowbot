
import { Interaction, StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const channels = interaction.guild!.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("event_settings_select")
    .setPlaceholder("Select global channel")
    .addOptions(channels);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({ content: "Select default global channel:", components: [row], ephemeral: true });
}