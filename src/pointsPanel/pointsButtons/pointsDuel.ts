import {
  ButtonInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import * as pointsSelectWeek from "./pointsSelectWeek";
import * as pointsCreate from "./pointsCreate";

const CATEGORY_ID = "duel";
const CATEGORY_LABEL = "Alliance Duel";

// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
export async function handlePointsDuel(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (weeks.length) {
    const weekRow = new ActionRowBuilder<ButtonBuilder>();
    weeks.forEach(week => {
      const buttons = pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week).components;
      buttons.forEach(btn => weekRow.addComponents(btn));
    });
    components.push(weekRow);
  }

  const createRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`points_create_week_${CATEGORY_ID}`)
      .setLabel("Create Week")
      .setStyle(ButtonStyle.Success)
  );
  components.push(createRow);

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Choose a week or create new**`,
    components,
    ephemeral: true
  });
}

// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Week ${week} clicked**`,
    ephemeral: true
  });
}

// -----------------------------
export async function handleCreateWeek(interaction: ButtonInteraction<CacheType>) {
  await pointsCreate.handleCreateWeek(interaction);
}