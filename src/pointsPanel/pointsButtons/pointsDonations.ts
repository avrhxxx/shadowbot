import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";

// Render wszystkich tygodni dla kategorii Donations
export async function renderWeeks(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsService.getAllWeeks("Donations");

  const rows = weeks.map(week =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_donations_${week}`)
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
      .setCustomId(`points_add_donations_${week}`)
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_remove_donations_${week}`)
      .setLabel("Remove Points")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`points_compare_donations_${week}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_list_donations_${week}`)
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.update({
    content: `📌 Donations – Week ${week}`,
    components: [row] // ❌ ephemeral usunięte
  });
}