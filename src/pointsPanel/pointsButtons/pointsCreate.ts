// src/pointsPanel/pointsButtons/pointsCreate.ts
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

/**
 * Otwiera modal tworzenia tygodnia
 */
export async function handleCreateWeek(i: ButtonInteraction<CacheType>) {

  const modal = new ModalBuilder()
    .setCustomId("points_create_week_modal")
    .setTitle("Create Points Week");

  const weekInput = new TextInputBuilder()
    .setCustomId("week_name")
    .setLabel("Week name (example: 01.03-07.03)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("01.03-07.03");

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(weekInput);

  modal.addComponents(row);

  await i.showModal(modal);
}

/**
 * Po wysłaniu modala
 */
export async function handleCreateWeekSubmit(i: ModalSubmitInteraction<CacheType>) {

  const weekName = i.fields.getTextInputValue("week_name");

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