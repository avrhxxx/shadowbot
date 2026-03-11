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
  weekName: string; // np. "March 01.03-07.03"
};

export const tempPointsWeekStore = new Map<string, TempPointsWeek>();

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
/**
 * Parsuje input tygodnia w formacie 01.03-07.03
 */
function parseWeekRange(input: string) {
  const match = input.trim().match(/^(\d{1,2})[./](\d{1,2})\s*-\s*(\d{1,2})[./](\d{1,2})$/);
  if (!match) return null;

  const [_, startDay, startMonth, endDay, endMonth] = match;
  return {
    startDay: Number(startDay),
    startMonth: Number(startMonth),
    endDay: Number(endDay),
    endMonth: Number(endMonth)
  };
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

  const weekInput = new TextInputBuilder()
    .setCustomId("week_name")
    .setLabel("Week range (example: 01.03-07.03)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("01.03-07.03");

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(weekInput);
  modal.addComponents(row);

  await i.showModal(modal);
}

// -----------------------------------------------------------
// HANDLE MODAL SUBMIT
// -----------------------------------------------------------
export async function handleCreateWeekSubmit(i: ModalSubmitInteraction<CacheType>) {
  const weekInput = i.fields.getTextInputValue("week_name");
  const parsed = parseWeekRange(weekInput);

  if (!parsed) {
    await safeReply(i, { content: "❌ Invalid week format. Use DD.MM-DD.MM, e.g., 01.03-07.03", ephemeral: true });
    return;
  }

  // Wyciągamy miesiąc z daty startowej
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[parsed.startMonth - 1] || "Unknown";

  const weekName = `${monthName} ${weekInput}`;
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