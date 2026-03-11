// src/pointsPanel/pointsButtons/pointsDonations.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";

export function renderPointsDonationsPanel(): MessageCreateOptions {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("donations_add")
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("donations_list")
      .setLabel("Points List")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("donations_compare")
      .setLabel("Compare Weeks")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("donations_guide")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("donations_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Alliance Donations – Points Panel**",
    components: [row1, row2]
  };
}