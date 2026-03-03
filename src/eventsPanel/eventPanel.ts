// src/eventsPanel/eventsButtons/eventsPanel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";

/**
 * Renderuje Event Panel
 * Rząd 1: operacje
 * Rząd 2: ustawienia i help
 */
export function renderEventPanel(): MessageCreateOptions {
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
      .setCustomId("event_download") // ten sam customId jak w handleDownload
      .setLabel("Download All Events") // zmieniona etykieta
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