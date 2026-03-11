// src/moderatorPanel/moderatorButtons/pointsMenu.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction } from "discord.js";

// --- Funkcja renderująca główny panel wyboru kategorii ---
export function renderPointsCategoryPanel() {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_category_donations") // Alliance Donations
      .setLabel("Alliance Donations")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("points_category_duel") // Alliance Duel
      .setLabel("Alliance Duel")
      .setStyle(ButtonStyle.Primary)
  );

  return {
    content: "📌 **Points Panel – Wybierz kategorię**",
    components: [row]
  };
}

// --- Handler przycisku Points Menu ---
export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  await interaction.reply({
    ...renderPointsCategoryPanel(),
    ephemeral: true
  });
}