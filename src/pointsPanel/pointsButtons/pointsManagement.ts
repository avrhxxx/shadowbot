// src/pointsPanel/pointsButtons/pointsManagement.ts
import {
  MessageCreateOptions,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  CacheType
} from "discord.js";

import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

// -----------------------------
// Tymczasowe kategorie punktów
// -----------------------------
export const POINT_CATEGORIES = [
  { id: "donations", label: "Alliance Donations" },
  { id: "duel", label: "Alliance Duel" }
];

// -----------------------------
// Render panelu wyboru kategorii
// -----------------------------
export function renderPointsManagementCategories(): MessageCreateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>();
  POINT_CATEGORIES.forEach((cat) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`points_management_category_${cat.id}`)
        .setLabel(cat.label)
        .setStyle(ButtonStyle.Primary) // niebieski
    );
  });

  return {
    content: "📌 **Points Management – Choose Category**",
    components: [row]
  };
}

// -----------------------------
// Handler dla głównego przycisku Points Management
// -----------------------------
export async function handlePointsManagementMain(interaction: ButtonInteraction<CacheType>) {
  const panel = renderPointsManagementCategories();
  await interaction.reply({
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}

// -----------------------------
// Handler kliknięcia w kategorię
// -----------------------------
export async function handlePointsManagement(interaction: ButtonInteraction<CacheType>) {
  if (!interaction.customId.startsWith("points_management_category_")) return;

  const categoryId = interaction.customId.replace("points_management_category_", "");

  if (categoryId === "donations") {
    await pointsDonations.handlePointsDonations(interaction);
  } else if (categoryId === "duel") {
    await pointsDuel.handlePointsDuel(interaction);
  } else {
    await interaction.reply({
      content: `⚠️ Unknown category: ${categoryId}`,
      ephemeral: true
    });
  }
}