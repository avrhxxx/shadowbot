// src/absencePanel/absenceButtons/absenceList.ts
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getAbsences, AbsenceObject } from "../absenceService";
import { getEventDateUTC } from "../../utils/timeUtils";

// -----------------------------
// HELPER: status based on today
// -----------------------------
function getStatusDot(absence: AbsenceObject): string {
  const today = new Date();
  const [fromDay, fromMonth] = absence.startDate.split("/").map(Number);
  const [toDay, toMonth] = absence.endDate.split("/").map(Number);

  const fromDate = new Date(today.getFullYear(), fromMonth - 1, fromDay);
  const toDate = new Date(today.getFullYear(), toMonth - 1, toDay);

  if (today < fromDate) return "🔴"; // upcoming
  if (today > toDate) return "🟢"; // ended
  return "🟡"; // ongoing
}

// -----------------------------
// HELPER: formatted date
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
    .setColor(0x1E90FF)
    .setDescription("Status: 🔴 upcoming | 🟡 ongoing | 🟢 ended");

  if (absences.length === 0) {
    embed.setDescription("✅ No absences recorded.");
  } else {
    for (const absence of absences) {
      const dot = getStatusDot(absence);
      embed.addFields({
        name: `${dot} ${absence.player}`,
        value: formatAbsenceDate(absence),
        inline: true
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