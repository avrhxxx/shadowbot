// =====================================
// 📁 src/system/absence/absenceButtons/absenceRemove.ts
// =====================================

import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  Guild
} from "discord.js";
import { removeAbsence } from "../absenceService";
import { notifyAbsenceRemoved } from "./absenceNotification";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

// ----------------------------
// SHOW REMOVE MODAL
// ----------------------------
export async function handleRemoveAbsence(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const traceId = createTraceId();

  logger.emit({
    scope: "absence.buttons",
    event: "remove_modal_open",
    traceId,
    context: {
      guildId: interaction.guildId,
      userId: interaction.user?.id,
    },
  });

  const modal = new ModalBuilder()
    .setTitle("Remove Absence")
    .setCustomId("absence_remove_modal");

  const nickInput = new TextInputBuilder()
    .setCustomId("player_nick")
    .setLabel("Player Nickname")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter nickname to remove")
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput)
  );

  await interaction.showModal(modal);
}

// ----------------------------
// HANDLE MODAL SUBMIT
// ----------------------------
export async function handleRemoveAbsenceSubmit(interaction: ModalSubmitInteraction) {
  const traceId = createTraceId();

  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const guild = interaction.guild as Guild;
  const nick = interaction.fields.getTextInputValue("player_nick").trim();

  logger.emit({
    scope: "absence.buttons",
    event: "remove_submit",
    traceId,
    input: {
      guildId,
      nick,
    },
  });

  try {
    const removed = await removeAbsence(guildId, nick);

    if (!removed) {
      logger.emit({
        scope: "absence.buttons",
        event: "remove_not_found",
        traceId,
        level: "warn",
        context: {
          guildId,
          nick,
        },
      });

      await interaction.followUp({
        content: `❌ No absence found for ${nick}.`
      });
      return;
    }

    logger.emit({
      scope: "absence.buttons",
      event: "remove_success",
      traceId,
      context: {
        guildId,
        nick,
        absenceId: removed.id,
      },
    });

    await interaction.followUp({
      content: `📌 Absence for ${nick} removed from the list.`
    });

    await notifyAbsenceRemoved(guild, nick);

  } catch (err) {
    logger.emit({
      scope: "absence.buttons",
      event: "remove_failed",
      traceId,
      level: "error",
      context: {
        guildId,
        nick,
      },
      error: err,
    });

    await interaction.followUp({
      content: "❌ An error occurred while trying to remove absence."
    });
  }
}