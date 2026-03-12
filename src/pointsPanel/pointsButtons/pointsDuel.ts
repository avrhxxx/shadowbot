import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";

// Render wszystkich tygodni dla kategorii Duel
export async function renderWeeks(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsService.getAllWeeks("Duel");

  const rows = weeks.map(week =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_duel_${week}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    )
  );

  await interaction.reply({
    content: "📅 Select a week:",
    components: rows,
    ephemeral: true
  });
}

// Obsługa kliknięcia przycisku tygodnia
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`points_add_duel_${week}`)
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_remove_duel_${week}`)
      .setLabel("Remove Points")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`points_compare_duel_${week}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_list_duel_${week}`)
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.update({
    content: `📌 Duel – Week ${week}`,
    components: [row] // ❌ ephemeral usunięte
  });
}