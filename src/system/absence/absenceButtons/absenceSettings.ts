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

  const textChannels = interaction.guild.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (!textChannels.length) {
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
    scope: "absence.settings",
    event: "open_settings",
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
  if (!guildId || !interaction.values.length) {
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
      await interaction.reply({
        content: `Notification channel is already set to <#${channelId}>.`,
        ephemeral: true
      });
      return;
    }

    await setNotificationChannel(guildId, channelId);

    await interaction.reply({
      content: `Notification channel set to <#${channelId}>.`,
      ephemeral: true
    });

    logger.emit({
      scope: "absence.settings",
      event: "channel_updated",
      traceId,
      context: {
        guildId,
        channelId,
      },
    });

  } catch (err) {
    logger.emit({
      scope: "absence.settings",
      event: "channel_update_failed",
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