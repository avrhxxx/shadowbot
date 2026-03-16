import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle } from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Render wszystkich tygodni dla kategorii Duel
// -----------------------------
export async function renderWeeks(): Promise<ActionRowBuilder<ButtonBuilder>[]> {
  const weeks = await pointsService.getAllWeeks("Duel");

  return weeks.map(week => {
    const safeWeek = encodeURIComponent(week);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_duel_${safeWeek}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    );
  });
}

// -----------------------------
// Obsługa kliknięcia przycisku tygodnia
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`points_add_duel_${encodeURIComponent(week)}`)
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_remove_duel_${encodeURIComponent(week)}`)
      .setLabel("Remove Points")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`points_compare_duel_${encodeURIComponent(week)}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_list_duel_${encodeURIComponent(week)}`)
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  );

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ content: `📌 Duel – Week ${week}`, components: [row] });
  } else {
    await interaction.reply({ content: `📌 Duel – Week ${week}`, components: [row], ephemeral: true });
  }
}

// -----------------------------
// Przygotowanie przycisku Create Week
// -----------------------------
export function createWeekButton(category = "duel") {
  return new ButtonBuilder()
    .setCustomId(`points_create_week_${category}`)
    .setLabel("Create Week")
    .setStyle(ButtonStyle.Success);
}