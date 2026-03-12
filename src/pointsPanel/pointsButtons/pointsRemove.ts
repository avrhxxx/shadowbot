// src/pointsPanel/pointsButtons/pointsRemove.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Placeholder Remove Points
// -----------------------------
export async function handleRemovePoints(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "🔴 Remove Points functionality placeholder – to be implemented.",
    ephemeral: true
  });
}