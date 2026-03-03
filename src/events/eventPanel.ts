// events/EventPanel.ts

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction
} from "discord.js";

import { handleEventInteraction } from "./eventHandlers";

export function renderEventPanel() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("event_create")
      .setLabel("Create Event")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("event_list")
      .setLabel("List Events")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("event_cancel")
      .setLabel("Cancel Event")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("event_manual_reminder")
      .setLabel("Manual Reminder")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("event_download")
      .setLabel("Download Participants")
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("event_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("event_help")
      .setLabel("Help")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Event Panel**",
    components: [row1, row2]
  };
}

export async function routeEventInteraction(interaction: Interaction) {
  await handleEventInteraction(interaction);
}