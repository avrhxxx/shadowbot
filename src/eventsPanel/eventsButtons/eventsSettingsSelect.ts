// src/eventsPanel/eventsButtons/eventsSettingsSelect.ts
import { StringSelectMenuInteraction } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleSettingsSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const selectedChannelId = interaction.values[0]; // wybór z select menu

  if (!selectedChannelId) {
    await interaction.reply({ content: "No channel selected.", ephemeral: true });
    return;
  }

  // Pobieramy obecny config lub tworzymy nowy
  const config = await EventStorage.getConfig(guildId);
  config.defaultChannelId = selectedChannelId;

  // Zapisujemy config
  await EventStorage.saveConfig(guildId, config);

  await interaction.reply({
    content: `Default global channel set to <#${selectedChannelId}>.`,
    ephemeral: true
  });
}