// src/eventsPanel/eventsButtons/eventsSettings.ts
import { 
  Interaction, 
  StringSelectMenuBuilder, 
  ActionRowBuilder, 
  StringSelectMenuInteraction 
} from "discord.js";

import { setConfig, getConfig } from "../eventService";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// ======================================================
// HANDLER SETTINGS BUTTON
// ======================================================
export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton() || !interaction.guild) return;

  const traceId = createTraceId();

  const textChannels = interaction.guild.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (!textChannels.length) {
    await interaction.reply({ content: "No text channels available.", ephemeral: true });

    logger.emit({
      scope: "events.settings",
      event: "no_channels",
      traceId,
      context: {
        guildId: interaction.guild.id,
      },
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

  logger.emit({
    scope: "events.settings",
    event: "open_settings",
    traceId,
    context: {
      guildId: interaction.guild.id,
      channelsCount: textChannels.length,
    },
  });
}

// ======================================================
// HANDLER SELECT MENU
// ======================================================
export async function handleSettingsSelect(interaction: StringSelectMenuInteraction) {
  const traceId = createTraceId();

  const guildId = interaction.guildId;
  if (!guildId || !interaction.values.length) {
    await interaction.reply({ content: "No channel selected.", ephemeral: true });

    logger.emit({
      scope: "events.settings",
      event: "no_selection",
      traceId,
      context: { guildId },
    });

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

    logger.emit({
      scope: "events.settings",
      event: "unknown_selection",
      traceId,
      context: {
        guildId,
        customId: interaction.customId,
      },
      level: "warn",
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

      logger.emit({
        scope: "events.settings",
        event: "channel_unchanged",
        traceId,
        context: {
          guildId,
          channelId,
          key,
        },
      });

      return;
    }

    await setConfig(guildId, key, channelId);

    await interaction.reply({
      content: `${key === "notificationChannel" ? "Notification" : "Download"} channel set to <#${channelId}>.`,
      ephemeral: true
    });

    logger.emit({
      scope: "events.settings",
      event: "channel_updated",
      traceId,
      context: {
        guildId,
        channelId,
        key,
      },
    });

  } catch (err) {
    logger.emit({
      scope: "events.settings",
      event: "channel_update_failed",
      traceId,
      level: "error",
      context: {
        guildId,
        channelId,
        key,
      },
      error: err,
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