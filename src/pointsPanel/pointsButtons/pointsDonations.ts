import { ButtonInteraction, CacheType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import * as pointsSelectWeek from "./pointsSelectWeek";
import * as pointsCreate from "./pointsCreate";

const CATEGORY_ID = "donations";
const CATEGORY_LABEL = "Alliance Donations";

function safeReply(interaction: ButtonInteraction<CacheType>, payload: any) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

export async function handlePointsDonations(interaction: ButtonInteraction<CacheType>) {
  const weeks = await pointsSelectWeek.getWeeksByCategory(CATEGORY_ID);

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  weeks.forEach(week => {
    components.push(pointsSelectWeek.renderWeekButton(CATEGORY_ID, week));
  });

  components.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`points_create_week_${CATEGORY_ID}`)
        .setLabel("Create Week")
        .setStyle(ButtonStyle.Success)
    )
  );

  await safeReply(interaction, {
    content: `📌 **${CATEGORY_LABEL} – Choose a week or create new**`,
    components,
    ephemeral: true
  });
}

export async function handleWeekClick(interaction: ButtonInteraction<CacheType>, week: string) {
  await pointsSelectWeek.handleWeekClick(interaction, CATEGORY_ID, week);
}

export async function handleCreateWeek(interaction: ButtonInteraction<CacheType>) {
  await pointsCreate.handleCreateWeek(interaction);
}