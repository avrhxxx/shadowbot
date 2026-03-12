// src/pointsPanel/pointsButtons/pointsList.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Placeholder Points List
// -----------------------------
export async function handlePointsListPanel(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "📋 Points List functionality placeholder – to be implemented.",
    ephemeral: true
  });
}