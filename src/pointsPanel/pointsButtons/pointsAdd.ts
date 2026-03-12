// src/pointsPanel/pointsButtons/pointsAdd.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Placeholder Add Points
// -----------------------------
export async function handleAddPoints(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "🟢 Add Points functionality placeholder – to be implemented.",
    ephemeral: true
  });
}