import { MessageCreateOptions, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType } from "discord.js";
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
// HELPERS
// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
// Render panelu wyboru kategorii (placeholder)
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
  await safeReply(interaction, {
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

  // Tworzymy przycisk "Create Week"
  const createWeekButton = new ButtonBuilder()
    .setCustomId(`points_create_week_${categoryId}`)
    .setLabel("Create Week")
    .setStyle(ButtonStyle.Success); // zielony

  if (categoryId === "donations") {
    // Render wszystkich tygodni dla Donations
    const weeksPanel = await pointsDonations.renderWeeks(interaction); 
    // Dodajemy przycisk Create Week
    const allRows = [...weeksPanel.components, new ActionRowBuilder<ButtonBuilder>().addComponents(createWeekButton)];
    await interaction.editReply({
      content: "📅 Donations – Select a week or create a new one:",
      components: allRows,
      ephemeral: true
    });
  } else if (categoryId === "duel") {
    const weeksPanel = await pointsDuel.renderWeeks(interaction);
    const allRows = [...weeksPanel.components, new ActionRowBuilder<ButtonBuilder>().addComponents(createWeekButton)];
    await interaction.editReply({
      content: "📅 Duel – Select a week or create a new one:",
      components: allRows,
      ephemeral: true
    });
  } else {
    await safeReply(interaction, {
      content: `⚠️ Unknown category: ${categoryId}`,
      ephemeral: true
    });
  }
}