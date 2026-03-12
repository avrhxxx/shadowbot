// src/pointsPanel/pointsButtons/pointsList.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

// -----------------------------
// Placeholder Points List
// -----------------------------
export async function handlePointsList(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "📋 Points List – placeholder functionality. To be implemented.",
    ephemeral: true
  });
}