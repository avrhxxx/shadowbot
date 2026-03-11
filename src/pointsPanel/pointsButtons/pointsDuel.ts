// src/pointsPanel/pointsButtons/pointsDuel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";

export function renderPointsDuelPanel(): MessageCreateOptions {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("duel_add")
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("duel_list")
      .setLabel("Points List")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("duel_compare")
      .setLabel("Compare Weeks")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("duel_guide")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("duel_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Alliance Duel – Points Panel**",
    components: [row1, row2]
  };
}