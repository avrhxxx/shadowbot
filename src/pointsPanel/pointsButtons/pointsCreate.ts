// src/pointsPanel/pointsButtons/pointsCreate.ts
import { ButtonInteraction, ModalSubmitInteraction, CacheType } from "discord.js";

// -----------------------------
// Placeholder Create Week
// -----------------------------
export async function handleCreateWeekCategory(interaction: ButtonInteraction<CacheType>) {
  await interaction.reply({
    content: "🟢 Create Week – placeholder functionality. To be implemented.",
    ephemeral: true
  });
}

// -----------------------------
// Placeholder handle modal submit
// -----------------------------
export async function handleCreateWeekSubmit(interaction: ModalSubmitInteraction<CacheType>) {
  await interaction.reply({
    content: "🟢 Create Week Submit – placeholder functionality. To be implemented.",
    ephemeral: true
  });
}