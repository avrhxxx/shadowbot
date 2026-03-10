// src/absencePanel/absenceButtons/absenceRemove.ts
import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from "discord.js";

import { removeAbsence } from "../absenceService";

// ----------------------------
// SHOW REMOVE MODAL
// ----------------------------
export async function handleRemoveAbsence(interaction: ButtonInteraction) {

  const modal = new ModalBuilder()
    .setTitle("Remove Absence")
    .setCustomId("absence_remove_modal");

  const nickInput = new TextInputBuilder()
    .setCustomId("player_nick")
    .setLabel("Player Nickname")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter nickname to remove")
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput)
  );

  await interaction.showModal(modal);
}

// ----------------------------
// HANDLE MODAL SUBMIT
// ----------------------------
export async function handleRemoveAbsenceSubmit(interaction: ModalSubmitInteraction) {

  const guildId = interaction.guildId!;
  const nick = interaction.fields.getTextInputValue("player_nick").trim();

  try {
    // Wywołanie serwisu, który usuwa gracza tylko jeśli jest w bazie
    const removed = await removeAbsence(guildId, nick);

    if (!removed) {
      // Gracz nie był na liście → nie można usunąć
      await interaction.reply({
        content: `❌ No absence found for **${nick}**.`,
        ephemeral: true
      });
      return;
    }

    // Sukces – gracz został usunięty z listy i bazy
    await interaction.reply({
      content: `✅ Absence for **${nick}** removed.`,
      ephemeral: true
    });

  } catch (err) {
    console.error("Error removing absence:", err);

    await interaction.reply({
      content: "❌ Failed to remove absence.",
      ephemeral: true
    });
  }
}