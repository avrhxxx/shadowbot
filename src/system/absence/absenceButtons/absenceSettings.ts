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
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

// -----------------------------
// HANDLER SETTINGS BUTTON
// -----------------------------
export async function handleSettings(
  interaction: Interaction,
  ctx: TraceContext
) {
  if (!interaction.isButton() || !interaction.guild) return;

  const l = log.ctx(ctx);

  l.event("settings_open", {
    guildId: interaction.guild.id,
    userId: interaction.user?.id,
  });

  const textChannels = interaction.guild.channels.cache
    .filter(c => c.isTextBased())
    .map(c => ({ label: c.name, value: c.id }));

  if (!textChannels.length) {
    l.warn("settings_no_channels", {
      guildId: interaction.guild.id,
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

  l.event("settings_rendered", {
    guildId: interaction.guild.id,
    channelsCount: textChannels.length,
  });
}

// -----------------------------
// HANDLER SELECT MENU
// -----------------------------
export async function handleSettingsSelect(
  interaction: StringSelectMenuInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;

  l.event("settings_select", {
    guildId,
    values: interaction.values,
  });

  if (!guildId || !interaction.values.length) {
    l.warn("settings_invalid_selection");

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
      l.event("settings_already_set", {
        guildId,
        channelId,
      });

      await interaction.reply({
        content: `Notification channel is already set to <#${channelId}>.`,
        ephemeral: true
      });
      return;
    }

    await setNotificationChannel(guildId, channelId);

    l.event("settings_updated", {
      guildId,
      channelId,
    });

    await interaction.reply({
      content: `Notification channel set to <#${channelId}>.`,
      ephemeral: true
    });

  } catch (err) {
    l.error("settings_update_failed", err, {
      guildId,
      channelId,
    });

    await interaction.reply({
      content: "Failed to set channel. Try again later.",
      ephemeral: true
    });
  }
}