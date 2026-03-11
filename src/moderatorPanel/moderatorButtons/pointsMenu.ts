// src/moderatorPanel/moderatorButtons/pointsMenu.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction } from "discord.js";

// --- Funkcja renderująca panel Points Menu ---
export function renderPointsPanel() {
  // Rząd 1: operacje główne
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_add")
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("points_list")
      .setLabel("Points List")
      .setStyle(ButtonStyle.Primary), // niebieski

    new ButtonBuilder()
      .setCustomId("points_compare")
      .setLabel("Compare Weeks")
      .setStyle(ButtonStyle.Primary) // niebieski
  );

  // Rząd 2: pomoc i ustawienia
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_help")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success), // zielony

    new ButtonBuilder()
      .setCustomId("points_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary) // szary
  );

  return {
    content: "📌 **Points Panel**",
    components: [row1, row2]
  };
}

// --- Handler przycisku Points Menu ---
export async function handlePointsMenu(interaction: Interaction) {
  if (!interaction.isButton()) return;

  await interaction.reply({
    ...renderPointsPanel(),
    ephemeral: true
  });
}