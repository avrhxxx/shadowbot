// src/pointsPanel/pointsButtons/pointsAdd.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

// -----------------------------
// Placeholder Add Points
// -----------------------------
export async function handleAddPoints(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "🟢 Add Points – placeholder functionality. To be implemented.",
    ephemeral: true
  });
}