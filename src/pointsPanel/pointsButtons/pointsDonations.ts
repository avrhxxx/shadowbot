// src/pointsPanel/pointsButtons/pointsDonations.ts
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle, EmbedBuilder } from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Render wszystkich tygodni dla kategorii Donations
// -----------------------------
export async function renderWeeks(): Promise<ActionRowBuilder<ButtonBuilder>[]> {
  const weeks = await pointsService.getAllWeeks("Donations");

  return weeks.map(week => {
    const safeWeek = encodeURIComponent(week);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_donations_${safeWeek}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    );
  });
}

// -----------------------------
// Obsługa kliknięcia przycisku tygodnia
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  // Pobieramy aktualne punkty dla tygodnia
  const points = await pointsService.getPoints("Donations", week);

  // Tworzymy embed z punktami lub informacją, że brak
  const embed = new EmbedBuilder()
    .setTitle(`📌 Donations – Week ${week}`)
    .setColor("Green")
    .setDescription(
      points && points.length > 0
        ? points.map(p => `• ${p.player}: ${p.points} points`).join("\n")
        : "⚠️ No points yet for this week."
    );

  // Przyciski Add / Remove / Compare / List
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`points_add_donations_${encodeURIComponent(week)}`)
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_remove_donations_${encodeURIComponent(week)}`)
      .setLabel("Remove Points")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`points_compare_donations_${encodeURIComponent(week)}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_list_donations_${encodeURIComponent(week)}`)
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  );

  // Wysyłamy lub edytujemy interakcję
  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
}

// -----------------------------
// Przygotowanie przycisku Create Week
// -----------------------------
export function createWeekButton(category = "donations") {
  return new ButtonBuilder()
    .setCustomId(`points_create_week_${category}`)
    .setLabel("Create Week")
    .setStyle(ButtonStyle.Success);
}