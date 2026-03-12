// src/pointsPanel/pointsButtons/pointsDuel.ts
import {
  ButtonInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder
} from "discord.js";
import * as pointsSelectWeek from "./pointsSelectWeek";

// Kategoria
const CATEGORY_ID = "duel";
const CATEGORY_LABEL = "Alliance Duel";

// -----------------------------
// HELPERS
// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
// Render panel wyboru tygodni
// -----------------------------
export async function handlePointsDuel(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  if (!weeks.length) {
    await safeReply(interaction, {
      content: `⚠️ No weeks created yet for **${CATEGORY_LABEL}**.`,
      ephemeral: true
    });
    return;
  }

  const components = weeks.map(week => pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week));

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Choose a week to manage**`,
    components,
    ephemeral: true
  });
}

// -----------------------------
// Opcjonalnie: Handler dla pojedynczego tygodnia
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week);

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}