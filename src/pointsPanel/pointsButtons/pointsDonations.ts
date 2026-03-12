// src/pointsPanel/pointsButtons/pointsDonations.ts
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, MessageCreateOptions } from "discord.js";
import * as pointsCreate from "./pointsCreate";
import * as pointsSelectWeek from "./pointsSelectWeek";

// Kategoria
const CATEGORY_ID = "donations";
const CATEGORY_LABEL = "Alliance Donations";

// -----------------------------
// Render panel dla tej kategorii
// -----------------------------
export function renderPointsDonationsPanel(weeks: string[]): MessageCreateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>();

  // Tygodnie
  weeks.forEach(week => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`points_donations_week_${week}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    );
  });

  // Create Week
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`points_create_week_${CATEGORY_ID}`)
      .setLabel("Create Week")
      .setStyle(ButtonStyle.Success) // zielony
  );

  return {
    content: `📌 **${CATEGORY_LABEL} – Weeks**`,
    components: [row]
  };
}

// -----------------------------
// Handler kliknięcia w panel tej kategorii
// -----------------------------
export async function handlePointsDonations(interaction: ButtonInteraction<CacheType>) {
  // Pobieramy aktualne tygodnie z serwisu
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  await interaction.reply({
    content: `📌 **${CATEGORY_LABEL} – Choose Week or create new**`,
    components: renderPointsDonationsPanel(weeks).components,
    ephemeral: true
  });
}

// -----------------------------
// Handler kliknięcia tygodnia
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  // Tutaj po kliknięciu tygodnia wyświetlamy Add / Remove / Compare / List
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`points_add_${CATEGORY_ID}_${week}`)
        .setLabel("Add Points")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_remove_${CATEGORY_ID}_${week}`)
        .setLabel("Remove Points")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`points_compare_${CATEGORY_ID}_${week}`)
        .setLabel("Compare")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_list_${CATEGORY_ID}_${week}`)
        .setLabel("List")
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.reply({
    content: `📌 **${CATEGORY_LABEL} – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}