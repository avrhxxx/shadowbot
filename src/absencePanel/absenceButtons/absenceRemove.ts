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

// ----------------------------
// SHOW REMOVE MODAL
// ----------------------------
export async function handleRemoveAbsence(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setTitle("Remove Absence")
    .setCustomId("absence_remove_modal");

  const nickInput = new TextInputBuilder()
    .setCustomId("player_nick")
    .setLabel("Player Nickname")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter nickname to remove")
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput));
  await interaction.showModal(modal);
}

// ----------------------------
// HANDLE MODAL SUBMIT
// ----------------------------
export async function handleRemoveAbsenceSubmit(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const guild = interaction.guild as Guild;
  const nick = interaction.fields.getTextInputValue("player_nick").trim();

  try {
    const removed = await removeAbsence(guildId, nick);

    if (!removed) {
      await interaction.followUp({ content: `❌ No absence found for ${nick}.` });
      return;
    }

    await interaction.followUp({ content: `📌 Absence for ${nick} removed from the list.` });

    // Powiadomienie tylko dla tego usuniętego
    await notifyAbsenceRemoved(guild, nick);

  } catch (err) {
    console.error("Error removing absence:", err);
    await interaction.followUp({ content: "❌ An error occurred while trying to remove absence." });
  }
}