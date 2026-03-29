// =====================================
// 📁 src/system/events/eventsButtons/eventsSettings.ts
// =====================================

import { 
  Interaction, 
  StringSelectMenuBuilder, 
  ActionRowBuilder, 
  StringSelectMenuInteraction 
} from "discord.js";

import { setConfig, getConfig } from "../eventService";
import { log } from "../../../core/logger/log";
import type { TraceContext } from "../../../core/trace/TraceContext";

// ======================================================
// HANDLER SETTINGS BUTTON
// ======================================================
export async function handleSettings(interaction: Interaction, ctx: TraceContext) {
  if (!interaction.isButton() || !interaction.guild) return;

  const l = log.ctx(ctx);

  const textChannels = interaction.guild.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (!textChannels.length) {
    await interaction.reply({ content: "No text channels available.", ephemeral: true });

    l.warn("no_channels", {
      guildId: interaction.guild.id,
    });

    return;
  }

  const notificationSelect = createSelectMenu(
    "event_settings_notification",
    "Select notification channel",
    textChannels
  );

  const downloadSelect = createSelectMenu(
    "event_settings_download",
    "Select download channel",
    textChannels
  );

  await interaction.reply({
    content: "Select channels for events:",
    components: [createRow(notificationSelect), createRow(downloadSelect)],
    ephemeral: true
  });

  l.event("open_settings", {
    guildId: interaction.guild.id,
    channelsCount: textChannels.length,
  });
}

// ======================================================
// HANDLER SELECT MENU
// ======================================================
export async function handleSettingsSelect(interaction: StringSelectMenuInteraction, ctx: TraceContext) {
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  if (!guildId || !interaction.values.length) {
    await interaction.reply({ content: "No channel selected.", ephemeral: true });

    l.warn("no_selection", { guildId });

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

    l.warn("unknown_selection", {
      guildId,
      customId: interaction.customId,
    });

    return;
  }

  try {
    const config = await getConfig(guildId);

    if (config[key] === channelId) {
      await interaction.reply({
        content: `${key === "notificationChannel" ? "Notification" : "Download"} channel is already set to <#${channelId}>.`,
        ephemeral: true
      });

      l.event("channel_unchanged", {
        guildId,
        channelId,
        key,
      });

      return;
    }

    await setConfig(guildId, key, channelId);

    await interaction.reply({
      content: `${key === "notificationChannel" ? "Notification" : "Download"} channel set to <#${channelId}>.`,
      ephemeral: true
    });

    l.event("channel_updated", {
      guildId,
      channelId,
      key,
    });

  } catch (err) {
    l.error("channel_update_failed", err, {
      guildId,
      channelId,
      key,
    });

    await interaction.reply({
      content: "Failed to set channel. Please try again later.",
      ephemeral: true
    });
  }
}

// ======================================================
// HELPERS
// ======================================================
function createSelectMenu(
  customId: string,
  placeholder: string,
  options: { label: string; value: string }[]
) {
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(options);
}

function createRow(component: StringSelectMenuBuilder) {
  return new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(component);
}