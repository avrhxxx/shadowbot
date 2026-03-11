import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";

/**
 * Renderuje Absence Panel – jeden rząd dla wszystkich przycisków
 */
export function renderAbsencePanel(): MessageCreateOptions {

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("absence_list")  // nowy plik i handler
      .setLabel("Absences List")    // widoczne dla użytkownika
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("absence_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("absence_help")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Absence Panel**",
    components: [row]
  };
}