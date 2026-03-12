import {
  ButtonInteraction,
  ModalSubmitInteraction,
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
function safeReply(
  interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>,
  payload: any
) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// -----------------------------
// Render panel wyboru tygodni + Create Week
// -----------------------------
export async function handlePointsDonations(
  interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>
) {
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
// Handler kliknięcia tygodnia
// -----------------------------
export async function handleWeekClick(
  interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>,
  week: string
) {
  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Week ${week} clicked**`,
    ephemeral: true
  });
}

// -----------------------------
// Handler kliknięcia Create Week
// -----------------------------
export async function handleCreateWeek(
  interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>
) {
  await pointsCreate.handleCreateWeek(interaction as ButtonInteraction<CacheType>);
}