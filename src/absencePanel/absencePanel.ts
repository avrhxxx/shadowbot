import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";

/**
 * Renderuje Absence Panel
 * Rząd 1: operacje główne
 * Rząd 2: ustawienia i help
 */
export function renderAbsencePanel(): MessageCreateOptions {

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("absence_show_list")
      .setLabel("Show Absences")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("absence_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("absence_help")
      .setLabel("Help")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Absence Panel**",
    components: [row1, row2]
  };
}