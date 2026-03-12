import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  CacheType
} from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Funkcja pobierająca tygodnie dla danej kategorii
// -----------------------------
export async function getWeeksByCategory(categoryId: string): Promise<string[]> {
  const allWeeks = await pointsService.getAllWeeks();

  // Placeholder: wszystkie tygodnie należą do obu kategorii na razie
  return allWeeks;
}

// -----------------------------
// Renderuje przycisk tygodnia (tylko nazwa tygodnia)
// -----------------------------
export function renderWeekButton(categoryId: string, week: string): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`points_week_${categoryId}_${week}`)
    .setLabel(week)
    .setStyle(ButtonStyle.Primary);
}

// -----------------------------
// Render panel przycisków dla akcji wybranego tygodnia
// -----------------------------
export function renderActionButtons(categoryId: string, week: string): ActionRowBuilder<ButtonBuilder> {
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

  return row;
}

// -----------------------------
// Handler wyświetlania tygodni dla kategorii
// -----------------------------
export async function handleSelectWeek(interaction: ButtonInteraction<CacheType>, categoryId: string) {
  const weeks = await getWeeksByCategory(categoryId);

  if (!weeks.length) {
    await interaction.reply({
      content: `⚠️ No weeks created yet for **${categoryId}**.`,
      ephemeral: true
    });
    return;
  }

  // Tworzymy osobny wiersz przycisków dla każdego tygodnia
  const components = weeks.map(week => new ActionRowBuilder<ButtonBuilder>().addComponents(renderWeekButton(categoryId, week)));

  await interaction.reply({
    content: `📌 **${categoryId} – choose a week:**`,
    components,
    ephemeral: true
  });
}