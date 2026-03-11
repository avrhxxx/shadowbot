// src/pointsPanel/pointsPanel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions, Interaction } from "discord.js";

export function renderPointsCategoryPanel(): MessageCreateOptions {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_category_donations")
      .setLabel("Alliance Donations")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("points_category_duel")
      .setLabel("Alliance Duel")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_guide")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("points_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content: "📌 **Points Panel – Choose Category**",
    components: [row1, row2]
  };
}

export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  await interaction.reply({
    ...renderPointsCategoryPanel(),
    ephemeral: true
  });
}