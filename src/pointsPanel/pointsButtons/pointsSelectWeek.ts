import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";

// Pobiera wszystkie tygodnie dla kategorii
export async function getWeeksByCategory(categoryId: string): Promise<string[]> {
  const allWeeks = await pointsService.getAllWeeks();
  return allWeeks;
}

// Render pojedynczego przycisku tygodnia
export function renderWeekButton(categoryId: string, week: string): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`points_week_${categoryId}_${week}`)
      .setLabel(week)
      .setStyle(ButtonStyle.Primary)
  );
  return row;
}

// Obsługa kliknięcia tygodnia → render Add/Remove/Compare/List
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, categoryId: string, week: string) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`points_add_${categoryId}_${week}`)
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_remove_${categoryId}_${week}`)
      .setLabel("Remove Points")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`points_compare_${categoryId}_${week}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_list_${categoryId}_${week}`)
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.update({
    content: `📌 **${categoryId} – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}