// src/absencePanel/absenceButtons/absenceRemove.ts
import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from "discord.js";

import { getAbsences, removeAbsence } from "../absenceService";

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
    const absences = await getAbsences(guildId);
    const target = absences.find(a => a.player.toLowerCase() === nick.toLowerCase());

    if (!target) {
      await interaction.reply({
        content: `❌ No absence found for **${nick}** in the current list.`,
        ephemeral: true
      });
      return;
    }

    const removed = await removeAbsence(guildId, nick);

    if (!removed) {
      await interaction.reply({
        content: `❌ Failed to remove absence for **${nick}**.`,
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: `✅ Absence for **${nick}** removed from the list and database.`,
      ephemeral: true
    });

  } catch (err) {
    console.error("Error removing absence:", err);

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ An error occurred while trying to remove absence.",
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: "❌ An error occurred while trying to remove absence.",
          ephemeral: true
        });
      }
    }
  }
}