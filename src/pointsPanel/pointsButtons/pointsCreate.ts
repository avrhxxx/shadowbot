import {
  ButtonInteraction,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  CacheType
} from "discord.js";
import * as pointsService from "../pointsService";

// Pokazuje modal do tworzenia nowego tygodnia
export async function handleCreateWeek(i: ButtonInteraction<CacheType>) {
  const modal = new ModalBuilder()
    .setCustomId("points_create_week_modal")
    .setTitle("Create Points Week");

  const weekRangeInput = new TextInputBuilder()
    .setCustomId("week_range")
    .setLabel("Week Range (example: 01.03-07.03)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("01.03-07.03");

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(weekRangeInput);
  modal.addComponents(row);

  await i.showModal(modal);
}

// Obsługa wysłania modala i zapis do Google Sheets
export async function handleCreateWeekSubmit(i: ModalSubmitInteraction<CacheType>) {
  const weekRange = i.fields.getTextInputValue("week_range"); // np. "01.03-07.03"

  // Wyciągamy miesiąc z pierwszej daty
  const startDate = weekRange.split("-")[0].trim(); // "01.03"
  const monthNumber = Number(startDate.split(".")[1]); // "03" → 3
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthName = monthNames[monthNumber - 1];

  const weekName = `${monthName} ${weekRange}`; // np. "March 01.03-07.03"

  try {
    await pointsService.createWeek(weekName);

    await i.reply({
      content: `✅ Week **${weekName}** created.`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Create week error:", error);

    await i.reply({
      content: "❌ Failed to create week.",
      ephemeral: true
    });
  }
}