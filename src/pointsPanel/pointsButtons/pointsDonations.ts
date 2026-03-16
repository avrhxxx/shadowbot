// src/pointsPanel/pointsButtons/pointsDonations.ts
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle, EmbedBuilder } from "discord.js";
import * as pointsService from "../pointsService";

// -----------------------------
// Helper do bezpiecznego reply/edit
// -----------------------------
async function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) {
    return interaction.editReply(payload);
  }
  return interaction.reply(payload);
}

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
  const decodedWeek = decodeURIComponent(week);

  try {
    // Pobieramy punkty dla danego tygodnia
    const points = await pointsService.getPoints("Donations", decodedWeek) || [];

    // Tworzymy embed z punktami
    const embed = new EmbedBuilder()
      .setTitle(`📌 Donations – Week ${decodedWeek}`)
      .setDescription(
        points.length > 0
          ? points.map(p => `• ${p.user}: ${p.amount} points`).join("\n")
          : "No points yet."
      )
      .setColor(0x00ff00);

    // Przyciski Add / Remove / Compare / List
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_add_donations_${encodeURIComponent(decodedWeek)}`)
        .setLabel("Add Points")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_remove_donations_${encodeURIComponent(decodedWeek)}`)
        .setLabel("Remove Points")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`points_compare_donations_${encodeURIComponent(decodedWeek)}`)
        .setLabel("Compare")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_list_donations_${encodeURIComponent(decodedWeek)}`)
        .setLabel("List")
        .setStyle(ButtonStyle.Primary)
    );

    await safeReply(interaction, { embeds: [embed], components: [row], ephemeral: true });
  } catch (error) {
    console.error("handleWeekClick error:", error);
    await safeReply(interaction, { content: "❌ Failed to load points.", ephemeral: true });
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