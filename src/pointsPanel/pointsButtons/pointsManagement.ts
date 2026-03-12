// src/pointsPanel/pointsButtons/pointsManagement.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType, MessageCreateOptions } from "discord.js";
import * as pointsCreate from "./pointsCreate";
import * as pointsSelectWeek from "./pointsSelectWeek";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

// -----------------------------
// Stałe dla kategorii
// -----------------------------
export const POINT_CATEGORIES = [
  { id: "donations", label: "Alliance Donations" },
  { id: "duel", label: "Alliance Duel" }
];

// -----------------------------
// Render przycisków kategorii
// -----------------------------
export function renderPointsManagementCategories(): MessageCreateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>();
  POINT_CATEGORIES.forEach(cat => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`points_management_category_${cat.id}`)
        .setLabel(cat.label)
        .setStyle(ButtonStyle.Primary)
    );
  });

  return {
    content: "📌 **Points Management – Choose Category**",
    components: [row]
  };
}

// -----------------------------
// Handler kliknięcia kategorii
// -----------------------------
export async function handleCategoryClick(interaction: ButtonInteraction<CacheType>) {
  const match = interaction.customId.match(/^points_management_category_(.+)$/);
  if (!match) return;

  const categoryId = match[1];
  const category = POINT_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return;

  // Tworzymy przyciski dla tej kategorii:
  // 1️⃣ Lista tygodni
  // 2️⃣ Create Week
  // 3️⃣ Zarządzanie punktami (typu donations / duel)
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`points_select_week_${categoryId}`)
        .setLabel("Select Week")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_create_week_${categoryId}`)
        .setLabel("Create Week")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_manage_${categoryId}`)
        .setLabel("Manage Points")
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.reply({
    content: `📌 **${category.label} Management**`,
    components: [row],
    ephemeral: true
  });
}

// -----------------------------
// Dispatcher dla przycisków w tym module
// -----------------------------
export async function handlePointsManagement(interaction: ButtonInteraction<CacheType>) {
  if (interaction.customId.startsWith("points_management_category_")) {
    await handleCategoryClick(interaction);
  } else if (interaction.customId.startsWith("points_create_week_")) {
    const categoryId = interaction.customId.replace("points_create_week_", "");
    await pointsCreate.handleCreateWeek(interaction); // przekazujemy interaction do pointsCreate
  } else if (interaction.customId.startsWith("points_select_week_")) {
    const categoryId = interaction.customId.replace("points_select_week_", "");
    await pointsSelectWeek.handleSelectWeek(interaction, categoryId);
  } else if (interaction.customId.startsWith("points_manage_")) {
    const categoryId = interaction.customId.replace("points_manage_", "");
    if (categoryId === "donations") {
      await pointsDonations.handlePointsDonations(interaction);
    } else if (categoryId === "duel") {
      await pointsDuel.handlePointsDuel(interaction);
    }
  }
}