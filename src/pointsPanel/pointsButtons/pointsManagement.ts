import { ButtonInteraction, CacheType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from "discord.js";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";

export const POINT_CATEGORIES = [
  { id: "donations", label: "Alliance Donations" },
  { id: "duel", label: "Alliance Duel" }
];

function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

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
    content: "📌 **Points Management – Choose Category (placeholder)**",
    components: [row]
  };
}

export async function handlePointsManagementMain(interaction: ButtonInteraction<CacheType>) {
  const panel = renderPointsManagementCategories();
  await safeReply(interaction, {
    content: panel.content,
    components: panel.components,
    ephemeral: true
  });
}

export async function handlePointsManagement(interaction: ButtonInteraction<CacheType>) {
  if (!interaction.customId.startsWith("points_management_category_")) return;

  const categoryId = interaction.customId.replace("points_management_category_", "");

  if (categoryId === "donations") {
    await pointsDonations.handlePointsDonations(interaction);
  } else if (categoryId === "duel") {
    await pointsDuel.handlePointsDuel(interaction);
  } else {
    await safeReply(interaction, {
      content: `⚠️ Unknown category: ${categoryId}`,
      ephemeral: true
    });
  }
}