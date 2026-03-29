// =====================================
// 📁 src/system/absence/absenceButtons/absenceSettings.ts
// =====================================

import {
  Interaction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction
} from "discord.js";
import { setNotificationChannel, getAbsenceConfig } from "../absenceService";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// -----------------------------
// HANDLER SETTINGS BUTTON
// -----------------------------
export async function handleSettings(interaction: Interaction) {
  if (!interaction.isButton() || !interaction.guild) return;

  const traceId = createTraceId();

  logger.emit({
    scope: "absence.buttons",
    event: "settings_open",
    traceId,
    context: {
      guildId: interaction.guild.id,
      userId: interaction.user?.id,
    },
  });

  const textChannels = interaction.guild.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (!textChannels.length) {
    logger.emit({
      scope: "absence.buttons",
      event: "settings_no_channels",
      traceId,
      level: "warn",
      context: {
        guildId: interaction.guild.id,
      },
    });

    await interaction.reply({
      content: "No text channels available.",
      ephemeral: true
    });
    return;
  }

  const channelSelect = new StringSelectMenuBuilder()
    .setCustomId("absence_settings_notification")
    .setPlaceholder("Select notification channel")
    .addOptions(textChannels);

  await interaction.reply({
    content: "Select a channel for Absence notifications:",
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(channelSelect)
    ],
    ephemeral: true
  });

  logger.emit({
    scope: "absence.buttons",
    event: "settings_rendered",
    traceId,
    context: {
      guildId: interaction.guild.id,
      channelsCount: textChannels.length,
    },
  });
}

// -----------------------------
// HANDLER SELECT MENU
// -----------------------------
export async function handleSettingsSelect(interaction: StringSelectMenuInteraction) {
  const traceId = createTraceId();

  const guildId = interaction.guildId;

  logger.emit({
    scope: "absence.buttons",
    event: "settings_select",
    traceId,
    input: {
      guildId,
      values: interaction.values,
    },
  });

  if (!guildId || !interaction.values.length) {
    logger.emit({
      scope: "absence.buttons",
      event: "settings_invalid_selection",
      traceId,
      level: "warn",
    });

    await interaction.reply({
      content: "No channel selected.",
      ephemeral: true
    });
    return;
  }

  const channelId = interaction.values[0];

  try {
    const config = await getAbsenceConfig(guildId);

    if (config.notificationChannel === channelId) {
      logger.emit({
        scope: "absence.buttons",
        event: "settings_already_set",
        traceId,
        context: {
          guildId,
          channelId,
        },
      });

      await interaction.reply({
        content: `Notification channel is already set to <#${channelId}>.`,
        ephemeral: true
      });
      return;
    }

    await setNotificationChannel(guildId, channelId);

    logger.emit({
      scope: "absence.buttons",
      event: "settings_updated",
      traceId,
      context: {
        guildId,
        channelId,
      },
    });

    await interaction.reply({
      content: `Notification channel set to <#${channelId}>.`,
      ephemeral: true
    });

  } catch (err) {
    logger.emit({
      scope: "absence.buttons",
      event: "settings_update_failed",
      traceId,
      level: "error",
      context: {
        guildId,
        channelId,
      },
      error: err,
    });

    await interaction.reply({
      content: "Failed to set channel. Try again later.",
      ephemeral: true
    });
  }
}