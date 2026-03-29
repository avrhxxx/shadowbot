// src/system/points/pointsButtons/pointsManagement.ts

import { MessageCreateOptions, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType } from "discord.js";
import * as pointsDonations from "./pointsDonations";
import * as pointsDuel from "./pointsDuel";
import { logger } from "../../../core/logger/log";

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
export async function handlePointsManagementMain(
  interaction: ButtonInteraction<CacheType>,
  traceId: string
) {
  try {
    logger.emit({
      scope: "points.button",
      event: "points_management_open",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      },
    });

    const panel = renderPointsManagementCategories();

    await safeReply(interaction, {
      content: panel.content,
      components: panel.components,
      ephemeral: true
    });

  } catch (error) {
    logger.emit({
      scope: "points.button",
      event: "points_management_open_error",
      traceId,
      level: "error",
      error,
      context: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      },
    });

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Error while opening Points Management.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
}

// -----------------------------
// Handler kliknięcia w kategorię
// -----------------------------
export async function handlePointsManagement(
  interaction: ButtonInteraction<CacheType>,
  traceId: string
) {
  if (!interaction.customId.startsWith("points_management_category_")) return;

  const categoryId = interaction.customId.replace("points_management_category_", "");
  const guildId = interaction.guildId;

  if (!guildId) {
    await safeReply(interaction, {
      content: "❌ Guild context is required.",
      ephemeral: true
    });
    return;
  }

  try {
    logger.emit({
      scope: "points.button",
      event: "points_management_category_select",
      traceId,
      context: {
        userId: interaction.user.id,
        guildId,
        categoryId,
      },
    });

    let weekRows: ActionRowBuilder<ButtonBuilder>[] = [];
    let createButton: ButtonBuilder;

    if (categoryId === "donations") {
      weekRows = await pointsDonations.renderWeeks(guildId);
      createButton = pointsDonations.createWeekButton("donations");
    } else if (categoryId === "duel") {
      weekRows = await pointsDuel.renderWeeks(guildId);
      createButton = pointsDuel.createWeekButton("duel");
    } else {
      await safeReply(interaction, {
        content: `⚠️ Unknown category: ${categoryId}`,
        ephemeral: true
      });
      return;
    }

    const allRows = [
      ...weekRows,
      new ActionRowBuilder<ButtonBuilder>().addComponents(createButton)
    ];

    await safeReply(interaction, {
      content: `📅 ${categoryId === "donations" ? "Donations" : "Duel"} – Select a week or create a new one:`,
      components: allRows,
      ephemeral: true
    });

  } catch (error) {
    logger.emit({
      scope: "points.button",
      event: "points_management_category_error",
      traceId,
      level: "error",
      error,
      context: {
        userId: interaction.user.id,
        guildId,
        categoryId,
      },
    });

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Error while loading category.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  }
}