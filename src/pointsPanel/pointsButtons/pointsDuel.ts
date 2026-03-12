import {
  ButtonInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import * as pointsService from "../pointsService";

const CATEGORY = "Duel";

// Renderowanie przycisków wszystkich tygodni
export async function handlePointsDuel(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsService.getAllWeeks("Duel");

  if (weeks.length === 0) {
    await interaction.reply({ content: "⚠️ No weeks found for Duel.", ephemeral: true });
    return;
  }

  const rows = weeks.map(week =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_duel_${week}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    )
  );

  await interaction.reply({
    content: `📌 **${CATEGORY} – Select Week**`,
    components: rows,
    ephemeral: true
  });
}

// Obsługa kliknięcia tygodnia
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`points_add_duel_${week}`)
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_remove_duel_${week}`)
      .setLabel("Remove")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`points_compare_duel_${week}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_list_duel_${week}`)
      .setLabel("List")
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({
    content: `📌 **Duel – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}