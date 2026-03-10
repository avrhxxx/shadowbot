// src/absencePanel/absenceButtons/absenceRemove.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

export async function handleRemoveAbsence(interaction: ButtonInteraction) {
  await interaction.reply({
    content: "🛠 Remove Absence not implemented yet.",
    ephemeral: true
  });
}

export async function handleRemoveAbsenceSubmit(interaction: ModalSubmitInteraction) {
  await interaction.reply({
    content: "🛠 Remove Absence submit not implemented yet.",
    ephemeral: true
  });
}