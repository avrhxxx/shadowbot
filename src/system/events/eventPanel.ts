import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";

/**
 * Renderuje Event Panel
 * Rząd 1: operacje
 * Rząd 2: guide i ustawienia
 */
export function renderEventPanel(): MessageCreateOptions {

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("event_create")
      .setLabel("Create Event")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("event_list")
      .setLabel("Events List")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("event_manual_reminder")
      .setLabel("Manual Reminder")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("event_show_all")
      .setLabel("Show All")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("event_cancel")
      .setLabel("Cancel Event")
      .setStyle(ButtonStyle.Danger) // czerwony
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("event_help")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success), // zielony

    new ButtonBuilder()
      .setCustomId("event_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary) // szary, na końcu
  );

  return {
    content: "📌 **Event Panel**",
    components: [row1, row2]
  };
}