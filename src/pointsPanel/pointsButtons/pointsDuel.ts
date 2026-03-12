// src/pointsPanel/pointsButtons/pointsDuel.ts
import {
  ButtonInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import * as pointsSelectWeek from "./pointsSelectWeek";

// Kategoria
const CATEGORY_ID = "duel";
const CATEGORY_LABEL = "Alliance Duel";

// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
// Render panel wyboru tygodni + placeholder
// -----------------------------
export async function handlePointsDuel(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // Row 1: dynamiczne przyciski tygodni
  if (weeks.length) {
    const weekRow = new ActionRowBuilder<ButtonBuilder>();
    weeks.forEach(week => {
      const buttons = pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week).components;
      buttons.forEach(btn => weekRow.addComponents(btn));
    });
    components.push(weekRow);
  }

  // Row 2: placeholder “Create Week”
  const createRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`points_create_week_${CATEGORY_ID}`)
      .setLabel("Create Week – placeholder")
      .setStyle(ButtonStyle.Success)
  );
  components.push(createRow);

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Choose a week or create new (placeholder)**`,
    components,
    ephemeral: true
  });
}

// -----------------------------
// Handler kliknięcia tygodnia (placeholder)
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Week ${week} clicked (placeholder)**`,
    ephemeral: true
  });
}

// -----------------------------
// Handler kliknięcia Create Week (placeholder)
// -----------------------------
export async function handleCreateWeek(interaction: ButtonInteraction<CacheType>) {
  await safeReply(interaction, {
    content: `🟢 Create Week clicked (placeholder)`,
    ephemeral: true
  });
}