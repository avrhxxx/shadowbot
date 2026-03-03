// src/eventsPanel/eventsButtons/eventSettings.ts
import { Interaction, StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuInteraction } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const channels = interaction.guild!.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (channels.length === 0) {
    await interaction.reply({ content: "No text channels available.", ephemeral: true });
    return;
  }

  // Select menu dla notification channel
  const notificationSelect = new StringSelectMenuBuilder()
    .setCustomId("event_settings_notification")
    .setPlaceholder("Select notification channel")
    .addOptions(channels);

  // Select menu dla download channel
  const downloadSelect = new StringSelectMenuBuilder()
    .setCustomId("event_settings_download")
    .setPlaceholder("Select download channel")
    .addOptions(channels);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(notificationSelect);
  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(downloadSelect);

  await interaction.reply({
    content: "Select channels for events:",
    components: [row1, row2],
    ephemeral: true
  });
}

export async function handleSettingsSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const selectedChannelId = interaction.values[0];

  if (!selectedChannelId) {
    await interaction.reply({ content: "No channel selected.", ephemeral: true });
    return;
  }

  const config = await EventStorage.getConfig(guildId);

  if (interaction.customId === "event_settings_notification") {
    config.notificationChannelId = selectedChannelId;
    await EventStorage.saveConfig(guildId, config);
    await interaction.reply({
      content: `Notification channel set to <#${selectedChannelId}>.`,
      ephemeral: true
    });
  } else if (interaction.customId === "event_settings_download") {
    config.downloadChannelId = selectedChannelId;
    await EventStorage.saveConfig(guildId, config);
    await interaction.reply({
      content: `Download channel set to <#${selectedChannelId}>.`,
      ephemeral: true
    });
  }
}