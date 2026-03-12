// src/pointsPanel/pointsButtons/pointsCompare.ts
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Placeholder Compare Weeks
// -----------------------------
export async function handleComparePoints(interaction: ButtonInteraction | ModalSubmitInteraction) {
  await interaction.reply({
    content: "📊 Compare Points functionality placeholder – to be implemented.",
    ephemeral: true
  });
}