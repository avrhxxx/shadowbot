
// =====================================
// 📁 src/system/absence/absencePanel.ts
// =====================================

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageCreateOptions
} from "discord.js";

/**
 * Renderuje Absence Panel – jeden rząd dla wszystkich przycisków
 */
export function renderAbsencePanel(): MessageCreateOptions {

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("absence_list") // zgodne z IDS.BUTTONS.SHOW_LIST
      .setLabel("Absences List")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("absence_help")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("absence_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Absence Panel**",
    components: [row]
  };
}