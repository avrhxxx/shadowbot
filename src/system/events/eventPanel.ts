import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";
import { IDS } from "../eventsHandlers";

/**
 * Renderuje Event Panel
 * Rząd 1: operacje
 * Rząd 2: guide i ustawienia
 */
export function renderEventPanel(): MessageCreateOptions {

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.BUTTONS.CREATE)
      .setLabel("Create Event")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(IDS.BUTTONS.LIST)
      .setLabel("Events List")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(IDS.BUTTONS.MANUAL_REMINDER)
      .setLabel("Manual Reminder")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(IDS.BUTTONS.SHOW_ALL)
      .setLabel("Show All")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(IDS.BUTTONS.CANCEL)
      .setLabel("Cancel Event")
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.BUTTONS.HELP)
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(IDS.BUTTONS.SETTINGS)
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Event Panel**",
    components: [row1, row2]
  };
}