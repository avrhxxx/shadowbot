import { 
  ButtonInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ModalSubmitInteraction, 
  Guild,
  ButtonBuilder,
  ButtonStyle,
  InteractionCollector
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
function parseDate(input: string, referenceYear?: number): { date: Date, yearUsed: number } | null {
  const cleaned = input.replace(/[^\d]/g, "");
  let day: number, month: number;

  const match = input.match(/^(\d{1,2})[./-]?(\d{1,2})$/);
  if (!match) return null;

  day = parseInt(match[1], 10);
  month = parseInt(match[2], 10);

  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  let year = referenceYear ?? new Date().getFullYear();
  let date = new Date(year, month - 1, day);

  if (date.getTime() < Date.now()) year += 1; // jeśli przeszła, ustaw następny rok
  date = new Date(year, month - 1, day);

  return { date, yearUsed: year };
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

  const fromParsed = parseDate(fromRaw);
  if (!fromParsed) {
    await interaction.followUp({ content: "Invalid start date format." });
    return;
  }

  const toParsed = parseDate(toRaw, fromParsed.yearUsed);
  if (!toParsed) {
    await interaction.followUp({ content: "Invalid end date format." });
    return;
  }

  const { date: fromDateObj } = fromParsed;
  const { date: toDateObj } = toParsed;

  const id = `${nick}-${fromDateObj.getDate()}${fromDateObj.getMonth() + 1}-${toDateObj.getDate()}${toDateObj.getMonth() + 1}-${fromDateObj.getFullYear()}`;

  try {
    await createAbsence({
      id,
      guildId,
      player: nick,
      startDate: `${fromDateObj.getDate()}/${fromDateObj.getMonth() + 1}/${fromDateObj.getFullYear()}`,
      endDate: `${toDateObj.getDate()}/${toDateObj.getMonth() + 1}/${toDateObj.getFullYear()}`,
      createdAt: Date.now()
    });

    await interaction.followUp({
      content: `📌 Absence for ${nick} added: ${formatDateDisplay(fromDateObj)} → ${formatDateDisplay(toDateObj)}`
    });

    await notifyAbsenceAdded(
      guild,
      nick,
      `${fromDateObj.getDate()}/${fromDateObj.getMonth() + 1}/${fromDateObj.getFullYear()}`,
      `${toDateObj.getDate()}/${toDateObj.getMonth() + 1}/${toDateObj.getFullYear()}`
    );

  } catch (err) {
    console.error("Error saving absence:", err);
    await interaction.followUp({ content: "❌ Failed to save absence." });
  }
}