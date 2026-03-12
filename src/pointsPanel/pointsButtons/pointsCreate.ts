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
  category: string;
  fromDate: { day: number; month: number };
  toDate: { day: number; month: number };
  weekName: string; // np. "March 01.03-07.03"
};

export const tempPointsWeekStore = new Map<string, TempPointsWeek>();

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
function safeReply(interaction: ButtonInteraction | ModalSubmitInteraction, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// Parsuje DD.MM
function parseDayMonth(input: string): { day: number; month: number } | null {
  const match = input.trim().match(/^(\d{1,2})[./](\d{1,2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null; // prosty check
  return { day, month };
}

// Sprawdza, czy From <= To
function isChronological(from: { day: number; month: number }, to: { day: number; month: number }) {
  if (from.month < to.month) return true;
  if (from.month === to.month && from.day <= to.day) return true;
  return false;
}

// Formatuje nazwe tygodnia
function formatWeekName(from: { day: number; month: number }, to: { day: number; month: number }) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[from.month - 1] || "Unknown";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${monthName} ${pad(from.day)}.${pad(from.month)} - ${pad(to.day)}.${pad(to.month)}`;
}

// -----------------------------------------------------------
// HANDLE CATEGORY BUTTON
// -----------------------------------------------------------
export async function handleCreateWeekCategory(interaction: ButtonInteraction<CacheType>, category: string) {
  const modal = new ModalBuilder()
    .setCustomId(`points_create_week_modal-${category}`)
    .setTitle(`Create Week – ${category}`);

  const fromInput = new TextInputBuilder()
    .setCustomId("from_date")
    .setLabel("From (DD.MM)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("01.03");

  const toInput = new TextInputBuilder()
    .setCustomId("to_date")
    .setLabel("To (DD.MM)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("07.03");

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(fromInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(toInput);

  modal.addComponents(row1, row2);

  await interaction.showModal(modal);
}

// -----------------------------------------------------------
// HANDLE MODAL SUBMIT
// -----------------------------------------------------------
export async function handleCreateWeekSubmit(i: ModalSubmitInteraction<CacheType>) {
  // Pobieramy kategorię z customId
  const typeMatch = i.customId.match(/^points_create_week_modal-(.+)$/);
  const category = typeMatch ? typeMatch[1] : "Unknown";

  const fromRaw = i.fields.getTextInputValue("from_date");
  const toRaw = i.fields.getTextInputValue("to_date");

  const from = parseDayMonth(fromRaw);
  const to = parseDayMonth(toRaw);

  if (!from || !to) {
    await safeReply(i, { content: "❌ Invalid date format. Use DD.MM, e.g., 01.03", ephemeral: true });
    return;
  }

  if (!isChronological(from, to)) {
    await safeReply(i, { content: "❌ 'From' date must be earlier than or equal to 'To' date.", ephemeral: true });
    return;
  }

  const weekName = formatWeekName(from, to);
  const tempId = `W-${uuidv4()}`;

  tempPointsWeekStore.set(tempId, { id: tempId, category, fromDate: from, toDate: to, weekName });

  try {
    await pointsService.createWeek(category, weekName, from, to);

    await safeReply(i, {
      content: `✅ Week **${weekName}** for category **${category}** created successfully.`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Create week error:", error);
    await safeReply(i, {
      content: "❌ Failed to create week.",
      ephemeral: true
    });
  } finally {
    tempPointsWeekStore.delete(tempId);
  }
}