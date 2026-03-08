// src/eventsPanel/eventsButtons/eventsSettings.ts
import { Interaction, StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuInteraction } from "discord.js";
import { setConfig, getConfig } from "../eventService";

// ======================================================
// HANDLER SETTINGS BUTTON
// ======================================================
export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton() || !interaction.guild) return;

  const textChannels = interaction.guild.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (!textChannels.length) {
    await interaction.reply({ content: "No text channels available.", ephemeral: true });
    return;
  }

  const notificationSelect = createSelectMenu("event_settings_notification", "Select notification channel", textChannels);
  const downloadSelect = createSelectMenu("event_settings_download", "Select download channel", textChannels);

  await interaction.reply({
    content: "Select channels for events:",
    components: [createRow(notificationSelect), createRow(downloadSelect)],
    ephemeral: true
  });
}

// ======================================================
// HANDLER SELECT MENU
// ======================================================
export async function handleSettingsSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId;
  if (!guildId || !interaction.values.length) {
    await interaction.reply({ content: "No channel selected.", ephemeral: true });
    return;
  }

  const channelId = interaction.values[0];
  const mapping: Record<string, string> = {
    event_settings_notification: "notificationChannel",
    event_settings_download: "downloadChannel"
  };

  const key = mapping[interaction.customId];
  if (!key) {
    await interaction.reply({ content: "Unknown selection.", ephemeral: true });
    return;
  }

  try {
    await setConfig(guildId, key, channelId);
    await interaction.reply({ content: `${key === "notificationChannel" ? "Notification" : "Download"} channel set to <#${channelId}>.`, ephemeral: true });
  } catch (err) {
    console.error("Error saving channel:", err);
    await interaction.reply({ content: "Failed to save channel. Please try again later.", ephemeral: true });
  }
}

// ======================================================
// HELPERS
// ======================================================
function createSelectMenu(customId: string, placeholder: string, options: { label: string; value: string }[]) {
  return new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder(placeholder).addOptions(options);
}

function createRow(component: StringSelectMenuBuilder | any) {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(component);
}