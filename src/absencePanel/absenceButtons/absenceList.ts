// src/absencePanel/absenceButtons/absenceShowList.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { getAbsences, AbsenceObject } from "../absenceService";

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
// MAIN HANDLER
// -----------------------------
export async function handleShowAbsences(interaction: ButtonInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "❌ Cannot fetch absences: no guild.", ephemeral: true });
    return;
  }

  const absences: AbsenceObject[] = await getAbsences(guildId);
  if (!absences.length) {
    await interaction.reply({ content: "✅ No absences recorded.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("📌 Current Absences")
    .setColor(0x1E90FF) // niebieski dla panelu
    .setDescription("Status: 🔴 upcoming | 🟡 ongoing | 🟢 ended");

  // Tworzymy pola po 3–4 osoby w rzędzie (inline)
  for (const absence of absences) {
    const dot = getStatusDot(absence);
    embed.addFields({
      name: `${dot} ${absence.player}`,
      value: `${absence.startDate} ➜ ${absence.endDate}`,
      inline: true
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
