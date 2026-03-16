// src/pointsPanel/pointsButtons/pointsDuel.ts
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle } from "discord.js";
import * as pointsService from "../pointsService";

/* ===========================
   HELPERS
=========================== */
async function safeUpdate(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.update(payload);
}

/* ===========================
   WEEKS
=========================== */
// Render wszystkich tygodni dla kategorii Duel – zwraca ActionRow[]
export async function renderWeeks(): Promise<ActionRowBuilder<ButtonBuilder>[]> {
  const weeks = await pointsService.getAllWeeks("Duel");

  return weeks.map(week =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_duel_${week}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    )
  );
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

  await safeUpdate(interaction, {
    content: `📌 Duel – Week ${week}`,
    components: [row]
  });
}

/* ===========================
   CREATE WEEK BUTTON
=========================== */
export function createWeekButton(category = "duel") {
  return new ButtonBuilder()
    .setCustomId(`points_create_week_${category}`)
    .setLabel("Create Week")
    .setStyle(ButtonStyle.Success);
}