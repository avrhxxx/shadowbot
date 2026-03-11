import {
  ButtonInteraction,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
  CacheType
} from "discord.js";
import * as PS from "../pointsService";

/**
 * Kliknięcie przycisku "Create Week"
 * Otwiera modal do wpisania nazwy tygodnia
 */
export async function handleCreateWeek(i: ButtonInteraction<CacheType>) {

  const modal = new ModalBuilder()
    .setCustomId("points_create_week_modal")
    .setTitle("Create Points Week");

  const weekInput = new TextInputBuilder()
    .setCustomId("week_name")
    .setLabel("Week (example: 01.03-07.03)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("01.03-07.03");

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(weekInput);

  modal.addComponents(row);

  await i.showModal(modal);
}

/**
 * Obsługa wysłania modala
 */
export async function handleCreateWeekSubmit(i: ModalSubmitInteraction<CacheType>) {

  const week = i.fields.getTextInputValue("week_name");

  try {
    await PS.createWeek(week);

    await i.reply({
      content: `✅ Week **${week}** created successfully.`,
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