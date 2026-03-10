// src/absencePanel/absenceButtons/absenceAdd.ts
import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction } from "discord.js";
import { setAbsence } from "../absenceService";

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
    .setPlaceholder("DD/MM")
    .setRequired(true);
}

// ----------------------------
// SHOW MODAL
// ----------------------------
export async function handleAddAbsence(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const modal = new ModalBuilder()
    .setTitle("Add Absence")
    .setCustomId("absence_add_modal");

  const nickInput = createTextInput("player_nick", "Player Link / Nickname", "Enter player link or nickname");
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
  const guildId = interaction.guildId!;
  const nick = interaction.fields.getTextInputValue("player_nick").trim();
  const fromRaw = interaction.fields.getTextInputValue("absence_from").trim();
  const toRaw = interaction.fields.getTextInputValue("absence_to").trim();

  const parseDate = (input: string) => {
    const match = input.match(/^(\d{1,2})[./-](\d{1,2})$/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return { day, month };
  };

  const fromDate = parseDate(fromRaw);
  const toDate = parseDate(toRaw);

  if (!fromDate || !toDate) {
    await interaction.reply({ content: "Invalid date format. Use DD/MM.", ephemeral: true });
    return;
  }

  // ------------------------
  // WYWOŁANIE SERWISU
  // ------------------------
  try {
    await setAbsence(guildId, nick, fromDate, toDate);
    await interaction.reply({
      content: `✅ Absence for **${nick}** added: from ${fromDate.day}/${fromDate.month} to ${toDate.day}/${toDate.month}`,
      ephemeral: true
    });
  } catch (err) {
    console.error("Error saving absence:", err);
    await interaction.reply({ content: "❌ Failed to save absence. Try again later.", ephemeral: true });
  }
}