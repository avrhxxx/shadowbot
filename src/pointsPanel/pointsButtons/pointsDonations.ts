import {
  ButtonInteraction,
  CacheType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import * as pointsSelectWeek from "./pointsSelectWeek";
import * as pointsCreate from "./pointsCreate";

// Kategoria
const CATEGORY_ID = "donations";
const CATEGORY_LABEL = "Alliance Donations";

// -----------------------------
// HELPERS
// -----------------------------
function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
// Render panel wyboru tygodni + Create Week
// -----------------------------
export async function handlePointsDonations(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // Row 1: dynamiczne przyciski tygodni
  if (weeks.length) {
    const weekRow = new ActionRowBuilder<ButtonBuilder>();
    weeks.forEach(week => {
      const btns = pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week).components;
      btns.forEach(btn => weekRow.addComponents(btn));
    });
    components.push(weekRow);
  }

  // Row 2: Create Week
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
// Handler kliknięcia tygodnia (pokazuje Add/Remove/Compare/List)
// -----------------------------
export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  const row = pointsSelectWeek.renderWeekButtons(CATEGORY_ID, week);

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Week ${week}**`,
    components: [row],
    ephemeral: true
  });
}

// -----------------------------
// Handler kliknięcia Create Week
// -----------------------------
export async function handleCreateWeek(interaction: ButtonInteraction<CacheType>) {
  await pointsCreate.handleCreateWeek(interaction);
}