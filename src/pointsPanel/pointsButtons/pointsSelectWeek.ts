import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  CacheType
} from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Pobiera tygodnie dla kategorii
// -----------------------------
export async function getWeeksByCategory(categoryId: string): Promise<string[]> {
  const allWeeks = await pointsService.getAllWeeks();
  return allWeeks; // placeholder: wszystkie tygodnie należą do obu kategorii
}

// -----------------------------
// Render przycisku dla tygodnia (tylko jeden przycisk)
// -----------------------------
export function renderWeekButton(categoryId: string, week: string): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`points_week_${categoryId}_${week}`)
      .setLabel(`${week}`)
      .setStyle(ButtonStyle.Primary)
  );
  return row;
}

// -----------------------------
// Wyświetla tygodnie dla kategorii
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

  const components = weeks.map(week => renderWeekButton(categoryId, week));

  await interaction.reply({
    content: `📌 **Weeks for ${categoryId} – choose a week**`,
    components,
    ephemeral: true
  });
}