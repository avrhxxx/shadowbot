// src/pointsPanel/pointsButtons/pointsCompare.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

// -----------------------------
// Placeholder Compare Weeks
// -----------------------------
export async function handleCompareWeeks(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "📊 Compare Weeks – placeholder functionality. To be implemented.",
    ephemeral: true
  });
}