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
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

// ----------------------------
// SHOW REMOVE MODAL
// ----------------------------
export async function handleRemoveAbsence(
  interaction: ButtonInteraction,
  ctx: TraceContext
) {
  if (!interaction.isButton()) return;

  const l = log.ctx(ctx);

  l.event("remove_modal_open", {
    guildId: interaction.guildId,
    userId: interaction.user?.id,
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
export async function handleRemoveAbsenceSubmit(
  interaction: ModalSubmitInteraction,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const guild = interaction.guild as Guild;
  const nick = interaction.fields.getTextInputValue("player_nick").trim();

  l.event("remove_submit", {
    guildId,
    nick,
  });

  try {
    const removed = await removeAbsence(guildId, nick);

    if (!removed) {
      l.warn("remove_not_found", {
        guildId,
        nick,
      });

      await interaction.followUp({
        content: `❌ No absence found for ${nick}.`
      });
      return;
    }

    l.event("remove_success", {
      guildId,
      nick,
      absenceId: removed.id,
    });

    await interaction.followUp({
      content: `📌 Absence for ${nick} removed from the list.`
    });

    await notifyAbsenceRemoved(guild, nick, ctx);

  } catch (err) {
    l.error("remove_failed", err, {
      guildId,
      nick,
    });

    await interaction.followUp({
      content: "❌ An error occurred while trying to remove absence."
    });
  }
}