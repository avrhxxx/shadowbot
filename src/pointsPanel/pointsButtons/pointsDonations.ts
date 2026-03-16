import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ButtonStyle } from "discord.js";
import * as pointsService from "../pointsService";
import * as Utils from "./utils";

// Render wszystkich tygodni dla kategorii Donations – zwraca komponenty
export async function renderWeeks(): Promise<ActionRowBuilder<ButtonBuilder>[]> {
  const weeks = await pointsService.getAllWeeks("Donations");

  return weeks.map(week =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_week_donations_${week}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    )
  );
}

// Obsługa kliknięcia przycisku tygodnia
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(Utils.makeAddPointsId("donations", week))
      .setLabel("Add Points")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(Utils.makeRemovePointsId("donations", week))
      .setLabel("Remove Points")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(Utils.makeComparePointsId("donations", week))
      .setLabel("Compare")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(Utils.makeListPointsId("donations", week))
      .setLabel("List")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.update({ content: `📌 Donations – Week ${week}`, components: [row] });
}

// Przygotowanie przycisku Create Week
export function createWeekButton(category = "donations") {
  return new ButtonBuilder()
    .setCustomId(Utils.makeCreateWeekId(category))
    .setLabel("Create Week")
    .setStyle(ButtonStyle.Success);
}

// Obsługa Create Week
import { handleCreateWeek } from "./pointsCreate";
export { handleCreateWeek };