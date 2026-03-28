// src/pointsPanel/pointsButtons/pointsRemove.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

// -----------------------------
// Placeholder Remove Points
// -----------------------------
export async function handleRemovePoints(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "🔴 Remove Points – placeholder functionality. To be implemented.",
    ephemeral: true
  });
}