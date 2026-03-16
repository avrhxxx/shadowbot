import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CacheType } from "discord.js";
import * as pointsService from "../pointsService";

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

export async function handlePointsDonations(interaction: ButtonInteraction<CacheType>) {
  await renderWeeks(interaction);
}