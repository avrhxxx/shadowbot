// src/pointsPanel/pointsButtons/pointsDonations.ts
import {
  ButtonInteraction,
  CacheType,
  MessageCreateOptions,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import * as pointsSelectWeek from "./pointsSelectWeek";

// Kategoria
const CATEGORY_ID = "donations";
const CATEGORY_LABEL = "Alliance Donations";

// -----------------------------
// HELPERS
// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
// Render panel wyboru tygodni z przyciskami
// -----------------------------
export async function handlePointsDonations(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  if (!weeks.length) {
    await safeReply(interaction, {
      content: `⚠️ No weeks created yet for **${CATEGORY_LABEL}**.`,
      ephemeral: true
    });
    return;
  }

  // Każdy tydzień dostaje własny wiersz przycisków
  const components = weeks.map(week => pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week));

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Choose a week to manage**`,
    components,
    ephemeral: true
  });
}

// -----------------------------
// Opcjonalnie: Handler dla pojedynczego tygodnia (jeżeli potrzebny gdzie indziej)
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week);

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}