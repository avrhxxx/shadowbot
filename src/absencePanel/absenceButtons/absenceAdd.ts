import { 
  ButtonInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ModalSubmitInteraction, 
  Guild 
} from "discord.js";
import { createAbsence, getAbsences } from "../absenceService";
import { notifyAbsenceAdded } from "./absenceNotification";

// ----------------------------
// HELPERS TO CREATE INPUTS
// ----------------------------
function createTextInput(customId: string, label: string, placeholder: string) {
  return new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(placeholder)
    .setRequired(true);
}

function createDateInput(customId: string, label: string) {
  return new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Available formats are in the message above the panel")
    .setRequired(true);
}

// ----------------------------
// PARSING & VALIDATION
// ----------------------------
function parseDayMonth(input: string): { day: number; month: number; year: number } | null {
  const cleaned = input.replace(/[^\d]/g, "");
  let day: number, month: number;

  if (cleaned.length === 4) {
    // format DDMM
    day = parseInt(cleaned.slice(0, 2), 10);
    month = parseInt(cleaned.slice(2), 10);
  } else {
    const match = input.match(/^(\d{1,2})[./-]?(\d{1,2})$/);
    if (!match) return null;
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const year = new Date().getFullYear();
  return { day, month, year };
}

function formatDateDisplay({ day, month, year }: { day: number; month: number; year: number }) {
  return `${day.toString().padStart(2, "0")}.${month.toString().padStart(2, "0")}.${year}`;
}

// ----------------------------
// SHOW MODAL
// ----------------------------
export async function handleAddAbsence(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const modal = new ModalBuilder()
    .setTitle("Add Absence")
    .setCustomId("absence_add_modal");

  const nickInput = createTextInput("player_nick", "Player Nickname", "Enter player nickname");
  const fromInput = createDateInput("absence_from", "From Date (day, month)");
  const toInput = createDateInput("absence_to", "To Date (day, month)");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(fromInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(toInput)
  );

  await interaction.showModal(modal);
}

// ----------------------------
// HANDLE MODAL SUBMIT
// ----------------------------
export async function handleAddAbsenceSubmit(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const guild = interaction.guild as Guild;
  const nick = interaction.fields.getTextInputValue("player_nick").trim();
  const fromRaw = interaction.fields.getTextInputValue("absence_from").trim();
  const toRaw = interaction.fields.getTextInputValue("absence_to").trim();

  const absences = await getAbsences(guildId);
  if (absences.some(a => a.player.toLowerCase() === nick.toLowerCase())) {
    await interaction.followUp({ content: `❌ Player ${nick} is already on the absence list.` });
    return;
  }

  const fromDate = parseDayMonth(fromRaw);
  const toDate = parseDayMonth(toRaw);
  if (!fromDate || !toDate) {
    await interaction.followUp({ content: "❌ Invalid date format. Use day.month or DDMM" });
    return;
  }

  // WALIDACJA: from <= to
  const fromTs = new Date(fromDate.year, fromDate.month - 1, fromDate.day).getTime();
  const toTs = new Date(toDate.year, toDate.month - 1, toDate.day).getTime();
  if (fromTs > toTs) {
    await interaction.followUp({ content: "❌ From date cannot be after To date." });
    return;
  }

  const id = `${nick}-${fromDate.day}${fromDate.month}-${toDate.day}${toDate.month}`;

  try {
    await createAbsence({
      id,
      guildId,
      player: nick,
      startDate: `${fromDate.day}/${fromDate.month}`,
      endDate: `${toDate.day}/${toDate.month}`,
      year: fromDate.year,
      createdAt: Date.now()
    });

    await interaction.followUp({
      content: `📌 Absence for ${nick} added: ${formatDateDisplay(fromDate)} → ${formatDateDisplay(toDate)}`
    });

    await notifyAbsenceAdded(
      guild,
      nick,
      `${fromDate.day}/${fromDate.month}`,
      `${toDate.day}/${toDate.month}`
    );

  } catch (err) {
    console.error("Error saving absence:", err);
    await interaction.followUp({ content: "❌ Failed to save absence." });
  }
}