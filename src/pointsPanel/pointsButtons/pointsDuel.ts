import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  MessageCreateOptions
} from "discord.js";
import * as pointsSelectWeek from "./pointsSelectWeek";

// Kategoria
const CATEGORY_ID = "duel";
const CATEGORY_LABEL = "Alliance Duel";

// -----------------------------
// HELPERS
// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
// Render panel dla tej kategorii
// -----------------------------
export function renderPointsDuelPanel(weeks: string[]): MessageCreateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>();

  weeks.forEach(week => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`points_duel_week_${week}`)
        .setLabel(week)
        .setStyle(ButtonStyle.Primary)
    );
  });

  // Create Week
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`points_create_week_${CATEGORY_ID}`)
      .setLabel("Create Week")
      .setStyle(ButtonStyle.Success)
  );

  return {
    content: `📌 **${CATEGORY_LABEL} – Weeks**`,
    components: [row]
  };
}

// -----------------------------
// Handler kliknięcia w panel tej kategorii
// -----------------------------
export async function handlePointsDuel(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Choose Week or create new**`,
    components: renderPointsDuelPanel(weeks).components,
    ephemeral: true
  });
}

// -----------------------------
// Handler kliknięcia tygodnia
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`points_add_${CATEGORY_ID}_${week}`)
        .setLabel("Add Points")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_remove_${CATEGORY_ID}_${week}`)
        .setLabel("Remove Points")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`points_compare_${CATEGORY_ID}_${week}`)
        .setLabel("Compare")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`points_list_${CATEGORY_ID}_${week}`)
        .setLabel("List")
        .setStyle(ButtonStyle.Primary)
    );

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}