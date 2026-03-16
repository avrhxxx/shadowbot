// src/pointsPanel/pointsButtons/pointsDonations.ts
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle } from "discord.js";
import * as pointsService from "../pointsService";

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
  // ✅ DeferUpdate, żeby Discord nie zgłaszał błędu
  if (!interaction.deferred) await interaction.deferUpdate();

  // Pobranie aktualnych punktów
  const points = await pointsService.getPoints("Donations", week);
  const pointsText = points.length > 0 
    ? points.map(p => `${p.user}: ${p.amount}`).join("\n")
    : "_No points recorded yet_";

  // Przyciski akcji
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`points_add_donations_${encodeURIComponent(week)}`)
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_remove_donations_${encodeURIComponent(week)}`)
      .setLabel("Remove Points")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`points_compare_donations_${encodeURIComponent(week)}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`points_list_donations_${encodeURIComponent(week)}`)
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  );

  // ✅ Edytujemy wiadomość po deferUpdate
  await interaction.editReply({
    content: `📌 Donations – Week ${week}\n\n${pointsText}`,
    components: [row]
  });
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