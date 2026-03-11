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
  ButtonStyle, 
  CacheType 
} from "discord.js";
import { createAbsence, getAbsences } from "../absenceService";
import { notifyAbsenceAdded } from "./absenceNotification";

// ----------------------------
// TEMP STORE FOR NEXT YEAR ABSENCES
// ----------------------------
export const tempAbsenceStore = new Map<string, {
  nick: string;
  fromRaw: string;
  toRaw: string;
  guildId: string;
  fromDateObj: Date;
  toDateObj: Date;
}>();

type InteractionType = ModalSubmitInteraction<CacheType> | ButtonInteraction<CacheType>;

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

  const fromDateObj = parseDateWithYear(fromRaw);
  if (!fromDateObj) {
    await interaction.followUp({ content: "Invalid start date format." });
    return;
  }

  const toDateObj = parseDateWithYear(toRaw, fromDateObj.getFullYear());
  if (!toDateObj) {
    await interaction.followUp({ content: "Invalid end date format." });
    return;
  }

  const now = new Date();
  if (fromDateObj.getTime() < now.getTime()) {
    const tempId = `${nick}-${Date.now()}`;
    tempAbsenceStore.set(tempId, { nick, fromRaw, toRaw, guildId, fromDateObj, toDateObj });

    await interaction.followUp({
      content: `The start date ${formatDateDisplay(fromDateObj)} has passed. Schedule for next year?`,
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

  await createAndNotifyAbsence(guild, nick, fromDateObj, toDateObj, guildId, interaction);
}

// ----------------------------
// CREATE ABSENCE & NOTIFY
// ----------------------------
export async function createAndNotifyAbsence(
  guild: Guild,
  nick: string,
  fromDateObj: Date,
  toDateObj: Date,
  guildId: string,
  interaction?: InteractionType
) {
  const id = `${nick}-${fromDateObj.getDate()}${fromDateObj.getMonth() + 1}-${toDateObj.getDate()}${toDateObj.getMonth() + 1}`;

  try {
    await createAbsence({
      id,
      guildId,
      player: nick,
      startDate: `${fromDateObj.getDate()}/${fromDateObj.getMonth() + 1}`,
      endDate: `${toDateObj.getDate()}/${toDateObj.getMonth() + 1}`,
      createdAt: Date.now(),
      year: fromDateObj.getFullYear()
    });

    if (interaction && "followUp" in interaction) {
      await interaction.followUp({
        content: `📌 Absence for ${nick} added: ${formatDateDisplay(fromDateObj)} → ${formatDateDisplay(toDateObj)}`
      });
    }

    await notifyAbsenceAdded(
      guild,
      nick,
      `${fromDateObj.getDate()}/${fromDateObj.getMonth() + 1}`,
      `${toDateObj.getDate()}/${toDateObj.getMonth() + 1}`,
      fromDateObj.getFullYear()
    );

  } catch (err) {
    console.error("Error saving absence:", err);
    if (interaction && "followUp" in interaction) {
      await interaction.followUp({ content: "❌ Failed to save absence." });
    }
  }
}

// ----------------------------
// HANDLE NEXT YEAR BUTTON
// ----------------------------
export async function handleNextYearAbsence(interaction: ButtonInteraction) {
  const [, tempId] = interaction.customId.split(/-(.+)/);
  const tempData = tempAbsenceStore.get(tempId);
  if (!tempData) {
    await interaction.reply({ content: "Temporary absence data not found.", ephemeral: true });
    return;
  }

  const fromDateNextYear = new Date(tempData.fromDateObj);
  fromDateNextYear.setFullYear(fromDateNextYear.getFullYear() + 1);

  const toDateNextYear = new Date(tempData.toDateObj);
  toDateNextYear.setFullYear(toDateNextYear.getFullYear() + 1);

  await createAndNotifyAbsence(
    interaction.guild!,
    tempData.nick,
    fromDateNextYear,
    toDateNextYear,
    tempData.guildId,
    interaction
  );

  tempAbsenceStore.delete(tempId);
  await interaction.update({ content: `Absence for ${tempData.nick} scheduled for next year.`, components: [] });
}