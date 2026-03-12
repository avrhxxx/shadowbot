import {
  ButtonInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import * as pointsService from "../pointsService";
import * as pointsList from "./pointsList";
import * as pointsAdd from "./pointsAdd";
import * as pointsRemove from "./pointsRemove";
import * as pointsCompare from "./pointsCompare";

const CATEGORY = "Donations";

// Renderowanie przycisków wszystkich tygodni
export async function handlePointsDonations(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsService.getAllWeeks("Donations");

  if (weeks.length === 0) {
    await interaction.reply({ content: "⚠️ No weeks found for Donations.", ephemeral: true });
    return;
  }

  const rows = weeks.map(week =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_donations_${week}`)
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
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({
    content: `📌 **Donations – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}