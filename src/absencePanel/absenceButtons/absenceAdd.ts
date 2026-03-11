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
import { updateAbsenceNotifications } from "./absenceNotification";

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
    .setPlaceholder("Formats: dd/mm or dd.mm")
    .setRequired(true);
}

// ----------------------------
// PARSING & VALIDATION
// ----------------------------
function parseDateWithYear(input: string, referenceYear?: number): Date | null {
  const cleaned = input.replace(/[^\d]/g, "");
  let day: number, month: number;

  if (/^\d{4}$/.test(cleaned)) {
    day = parseInt(cleaned.slice(0, 2), 10);
    month = parseInt(cleaned.slice(2), 10);
  } else {
    const match = input.match(/^(\d{1,2})[./-]?(\d{1,2})$/);
    if (!match) return null;
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const year = referenceYear ?? new Date().getFullYear();
  let date = new Date(year, month - 1, day);

  // jeśli data końcowa < data początkowa, ustaw rok następny
  if (referenceYear && date.getTime() < new Date(referenceYear, 0, 1).getTime()) {
    date.setFullYear(year + 1);
  }

  return date;
}

function formatDateDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
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
  const fromInput = createDateInput("absence_from", "From Date");
  const toInput = createDateInput("absence_to", "To Date");

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
    await interaction.followUp({
      content: `❌ Player **${nick}** is already on the absence list.`
    });
    return;
  }

  const fromDateObj = parseDateWithYear(fromRaw);
  if (!fromDateObj) {
    await interaction.followUp({ content: "❌ Invalid start date format." });
    return;
  }

  const toDateObj = parseDateWithYear(toRaw, fromDateObj.getFullYear());
  if (!toDateObj) {
    await interaction.followUp({ content: "❌ Invalid end date format." });
    return;
  }

  const id = `${nick}-${fromDateObj.getDate()}${fromDateObj.getMonth() + 1}-${toDateObj.getDate()}${toDateObj.getMonth() + 1}`;

  try {
    await createAbsence({
      id,
      guildId,
      player: nick,
      startDate: `${fromDateObj.getDate()}/${fromDateObj.getMonth() + 1}`,
      endDate: `${toDateObj.getDate()}/${toDateObj.getMonth() + 1}`,
      createdAt: Date.now(),
    });

    await interaction.followUp({
      content: `✅ Absence for **${nick}** added: ${formatDateDisplay(fromDateObj)} → ${formatDateDisplay(toDateObj)}`
    });

    // Odśwież embed i wyślij powiadomienie tylko dla tego gracza
    await updateAbsenceNotifications(guild, [nick]);

  } catch (err) {
    console.error("Error saving absence:", err);
    await interaction.followUp({ content: "❌ Failed to save absence." });
  }
}