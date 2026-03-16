import { MessageCreateOptions, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType } from "discord.js";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

// -----------------------------
// Kategorie punktów
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
// Render panelu wyboru kategorii
// -----------------------------
export function renderPointsManagementCategories(): MessageCreateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>();
  POINT_CATEGORIES.forEach((cat) => {
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

  let weekRows: ActionRowBuilder<ButtonBuilder>[] = [];
  let createButton: ButtonBuilder;

  if (categoryId === "donations") {
    weekRows = await pointsDonations.renderWeeks();
    createButton = pointsDonations.createWeekButton("donations");
  } else if (categoryId === "duel") {
    weekRows = await pointsDuel.renderWeeks();
    createButton = pointsDuel.createWeekButton("duel");
  } else {
    await safeReply(interaction, {
      content: `⚠️ Unknown category: ${categoryId}`,
      ephemeral: true
    });
    return;
  }

  // Dodaj przycisk Create Week jako osobny ActionRow
  const allRows = [...weekRows, new ActionRowBuilder<ButtonBuilder>().addComponents(createButton)];

  await safeReply(interaction, {
    content: `📅 ${categoryId === "donations" ? "Donations" : "Duel"} – Select a week or create a new one:`,
    components: allRows,
    ephemeral: true
  });
}