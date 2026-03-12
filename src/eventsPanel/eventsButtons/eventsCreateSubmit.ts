// src/pointsPanel/pointsButtons/pointsCreate.ts
import {
  ButtonInteraction,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  CacheType
} from "discord.js";
import { v4 as uuidv4 } from "uuid";
import * as pointsService from "../pointsService";

// -----------------------------------------------------------
// TEMP STORE
// -----------------------------------------------------------
export type TempPointsWeek = {
  id: string;
  weekName: string; // np. "March 01.03 - 07.03"
};

export const tempPointsWeekStore = new Map<string, TempPointsWeek>();

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------

/**
 * Parsuje input tygodnia w formacie DD.MM lub DDM M (0103 lub 01.03)
 */
function parseDayMonth(input: string) {
  const cleaned = input.replace(/[^\d]/g, ""); // usuń wszystko poza cyframi
  if (cleaned.length !== 4) return null;

  const day = Number(cleaned.slice(0, 2));
  const month = Number(cleaned.slice(2, 4));

  if (isNaN(day) || isNaN(month)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;

  return { day, month };
}

/**
 * Format DD.MM do stringa
 */
function formatDayMonth(d: number, m: number) {
  const dd = d.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${dd}.${mm}`;
}

/**
 * Bezpieczne reply
 */
async function safeReply(interaction: ButtonInteraction | ModalSubmitInteraction, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------------------------------------
// HANDLE CREATE WEEK BUTTON
// -----------------------------------------------------------
export async function handleCreateWeek(i: ButtonInteraction<CacheType>) {
  const modal = new ModalBuilder()
    .setCustomId("points_create_week_modal")
    .setTitle("Create Points Week");

  const weekFromInput = new TextInputBuilder()
    .setCustomId("week_from")
    .setLabel("Week FROM (example: 01.03 or 0103)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("01.03");

  const weekToInput = new TextInputBuilder()
    .setCustomId("week_to")
    .setLabel("Week TO (example: 07.03 or 0703)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("07.03");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(weekFromInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(weekToInput)
  );

  await i.showModal(modal);
}

// -----------------------------------------------------------
// HANDLE MODAL SUBMIT
// -----------------------------------------------------------
export async function handleCreateWeekSubmit(i: ModalSubmitInteraction<CacheType>) {
  const weekFromRaw = i.fields.getTextInputValue("week_from");
  const weekToRaw = i.fields.getTextInputValue("week_to");

  const from = parseDayMonth(weekFromRaw);
  const to = parseDayMonth(weekToRaw);

  if (!from) {
    await safeReply(i, { content: "❌ Invalid FROM date. Use DD.MM or DDM M, e.g., 01.03", ephemeral: true });
    return;
  }
  if (!to) {
    await safeReply(i, { content: "❌ Invalid TO date. Use DD.MM or DDM M, e.g., 07.03", ephemeral: true });
    return;
  }

  // Chronologia: FROM <= TO
  const fromValue = from.month * 100 + from.day;
  const toValue = to.month * 100 + to.day;
  if (fromValue > toValue) {
    await safeReply(i, { content: "❌ FROM date cannot be after TO date.", ephemeral: true });
    return;
  }

  // Autoformatowanie
  const weekFromStr = formatDayMonth(from.day, from.month);
  const weekToStr = formatDayMonth(to.day, to.month);

  // Wyciągamy nazwę miesiąca z daty startowej
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[from.month - 1] || "Unknown";

  const weekName = `${monthName} ${weekFromStr} - ${weekToStr}`;
  const tempId = `W-${uuidv4()}`;

  // Dodajemy tymczasowo
  tempPointsWeekStore.set(tempId, { id: tempId, weekName });

  try {
    await pointsService.createWeek(weekName);

    await safeReply(i, {
      content: `✅ Week **${weekName}** created successfully.`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Create week error:", error);
    await safeReply(i, {
      content: "❌ Failed to create week.",
      ephemeral: true
    });
  } finally {
    tempPointsWeekStore.delete(tempId); // czyszczenie temp store
  }
}