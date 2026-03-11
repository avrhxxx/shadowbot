import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction } from "discord.js";

// --- Funkcja renderująca główny panel wyboru kategorii ---
export function renderPointsCategoryPanel() {
  // Rząd 1: wybór kategorii
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_category_donations") // Alliance Donations
      .setLabel("Alliance Donations")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("points_category_duel") // Alliance Duel
      .setLabel("Alliance Duel")
      .setStyle(ButtonStyle.Primary)
  );

  // Rząd 2: guide i settings
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("points_guide")
      .setLabel("Guide")
      .setStyle(ButtonStyle.Success), // zielony

    new ButtonBuilder()
      .setCustomId("points_settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Secondary) // szary
  );

  return {
    content: "📌 **Points Panel – Wybierz kategorię**",
    components: [row1, row2]
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
