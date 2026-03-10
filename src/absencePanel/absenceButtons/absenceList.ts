// src/absencePanel/absenceButtons/absenceList.ts
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getAbsences, AbsenceObject } from "../absenceService";
import { getEventDateUTC } from "../../utils/timeUtils";

// -----------------------------
// Formatowanie daty DD.MM.YYYY
// -----------------------------
function formatAbsenceDate(absence: AbsenceObject): string {
  const todayYear = new Date().getFullYear();

  const [fromDay, fromMonth] = absence.startDate.split("/").map(Number);
  const [toDay, toMonth] = absence.endDate.split("/").map(Number);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(fromDay)}.${pad(fromMonth)}.${todayYear} → ${pad(toDay)}.${pad(toMonth)}.${todayYear}`;
}

// -----------------------------
// MAIN HANDLER
// -----------------------------
export async function handleAbsenceList(interaction: ButtonInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "❌ Cannot fetch absences: no guild.", ephemeral: true });
    return;
  }

  const absences: AbsenceObject[] = await getAbsences(guildId);

  const embed = new EmbedBuilder()
    .setTitle("📌 Current Absences")
    .setColor(0x1E90FF);

  if (absences.length === 0) {
    embed.setDescription("✅ No absences recorded.");
  } else {
    for (const absence of absences) {
      embed.addFields({
        name: absence.player,
        value: formatAbsenceDate(absence),
        inline: false
      });
    }
  }

  // -----------------------------
  // ACTION ROW: dynamic buttons
  // -----------------------------
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  // Add Absence – zawsze
  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId("absence_add")
      .setLabel("Add Absence")
      .setStyle(ButtonStyle.Success)
  );

  // Remove Absence – tylko jeśli są osoby na liście
  if (absences.length > 0) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId("absence_remove")
        .setLabel("Remove Absence")
        .setStyle(ButtonStyle.Danger)
    );
  }

  await interaction.reply({
    embeds: [embed],
    components: [actionRow],
    ephemeral: true
  });
}