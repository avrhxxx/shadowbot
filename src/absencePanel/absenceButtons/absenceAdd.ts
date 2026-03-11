// src/absencePanel/absenceButtons/absenceAdd.ts
import { 
  ButtonInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ModalSubmitInteraction, 
  Guild, 
  ButtonBuilder, 
  ButtonStyle 
} from "discord.js";
import { createAbsence, getAbsences, AbsenceObject } from "../absenceService";
import { notifyAbsenceAdded } from "./absenceNotification";

// -----------------------------------------------------------
// TEMP STORE FOR NEXT YEAR CONFIRMATION
// -----------------------------------------------------------
export const tempAbsenceStore = new Map<string, { player: string; from: { day: number; month: number }; to: { day: number; month: number }; guildId: string }>();

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
    .setPlaceholder("Available formats are in the message above the panel (day, month)")
    .setRequired(true);
}

// ----------------------------
// PARSING & VALIDATION
// ----------------------------
function parseDate(input: string): { day: number; month: number } | null {
  const match = input.match(/^(\d{1,2})[./-]?(\d{1,2})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return { day, month };
}

function formatDateDisplay(day: number, month: number, year: number): string {
  return `${day.toString().padStart(2,"0")}.${month.toString().padStart(2,"0")}.${year}`;
}

function buildDate(day: number, month: number, year?: number): Date {
  return new Date(year ?? new Date().getFullYear(), month - 1, day);
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
  const toParsed = parseDate(toRaw);
  if (!fromParsed || !toParsed) {
    await interaction.followUp({ content: "Invalid date format. Please use day and month." });
    return;
  }

  // Check if either date is in the past
  const now = new Date();
  const fromDateThisYear = buildDate(fromParsed.day, fromParsed.month);
  const toDateThisYear = buildDate(toParsed.day, toParsed.month);
  if (fromDateThisYear < now || toDateThisYear < now) {
    // Store temporarily and ask user
    const tempId = `${nick}-${Date.now()}`;
    tempAbsenceStore.set(tempId, { player: nick, from: fromParsed, to: toParsed, guildId });
    await interaction.followUp({
      content: `The date range ${formatDateDisplay(fromParsed.day, fromParsed.month, now.getFullYear())} → ${formatDateDisplay(toParsed.day, toParsed.month, now.getFullYear())} is in the past. Schedule for next year?`,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`next_year_yes-${tempId}`).setLabel("Yes").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`next_year_no-${tempId}`).setLabel("No").setStyle(ButtonStyle.Danger)
        )
      ],
      ephemeral: true
    });
    return;
  }

  await saveAbsence(interaction, guild, nick, fromParsed, toParsed, fromDateThisYear.getFullYear());
}

// ----------------------------
// SAVE ABSENCE & NOTIFY
// ----------------------------
export async function saveAbsence(
  interaction: ModalSubmitInteraction | ButtonInteraction,
  guild: Guild,
  nick: string,
  fromParsed: { day: number; month: number },
  toParsed: { day: number; month: number },
  year: number
) {
  const id = `${nick}-${fromParsed.day}${fromParsed.month}-${toParsed.day}${toParsed.month}`;

  const fromDateStr = `${fromParsed.day}/${fromParsed.month}`;
  const toDateStr = `${toParsed.day}/${toParsed.month}`;

  const absence: AbsenceObject = {
    id,
    guildId: guild.id,
    player: nick,
    startDate: fromDateStr,
    endDate: toDateStr,
    createdAt: Date.now()
  };

  try {
    await createAbsence(absence);

    await interaction.followUp({
      content: `📌 Absence for ${nick} added: ${formatDateDisplay(fromParsed.day, fromParsed.month, year)} → ${formatDateDisplay(toParsed.day, toParsed.month, year)}`,
      ephemeral: true
    });

    await notifyAbsenceAdded(guild, nick, fromDateStr, toDateStr);
  } catch (err) {
    console.error("Error saving absence:", err);
    await interaction.followUp({ content: "❌ Failed to save absence." });
  }
}

// ----------------------------
// HANDLE NEXT YEAR RESPONSE
// ----------------------------
export async function handleNextYearResponse(interaction: ButtonInteraction) {
  const [, tempId] = interaction.customId.split(/-(.+)/);
  const tempData = tempAbsenceStore.get(tempId);
  if (!tempData) {
    await interaction.reply({ content: "Temporary data not found.", ephemeral: true });
    return;
  }

  tempAbsenceStore.delete(tempId);

  if (interaction.customId.startsWith("next_year_no")) {
    await interaction.followUp({ content: "Operation cancelled.", ephemeral: true });
    return;
  }

  // Save absence for next year
  const nextYear = new Date().getFullYear() + 1;
  await saveAbsence(interaction, interaction.guild as Guild, tempData.player, tempData.from, tempData.to, nextYear);
}