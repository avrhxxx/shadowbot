import {
  ButtonInteraction,
  CacheType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  ButtonBuilder
} from "discord.js";
import * as pointsService from "../pointsService";
import * as pointsDonations from "./pointsDonations";

// ✅ Helper do bezpiecznego reply/edit
export async function safeReply(
  interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>,
  payload: any
) {
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// Parsowanie daty z inputu
function parseWeekDate(input: string) {
  const trimmed = input.trim();
  let match = trimmed.match(/^(\d{2})(\d{2})$/);
  if (match) return { day: parseInt(match[1], 10), month: parseInt(match[2], 10), hour: 0, minute: 0 };

  match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const hour = match[3] ? parseInt(match[3], 10) : 0;
  const minute = match[4] ? parseInt(match[4], 10) : 0;

  if (day < 1 || day > 31 || month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  return { day, month, hour, minute };
}

// Formatowanie nazwy tygodnia
function formatWeekName(from: { day: number; month: number }, to: { day: number; month: number }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(from.day)}-${pad(from.month)} - ${pad(to.day)}-${pad(to.month)}`;
}

// Otwieranie modala tworzenia tygodnia
export async function handleCreateWeek(interaction: ButtonInteraction<CacheType>) {
  const category = interaction.customId.replace("points_create_week_", "");

  const modal = new ModalBuilder()
    .setCustomId(`points_create_modal_${category}`)
    .setTitle(`Create Week – ${category}`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("week_from")
          .setLabel("From (DD/MM, DD/MM HH:mm or DDMM)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("1003")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("week_to")
          .setLabel("To (DD/MM, DD/MM HH:mm or DDMM)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("1703")
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);
}

// Obsługa submitu modala
export async function handleCreateWeekSubmit(interaction: ModalSubmitInteraction<CacheType>) {
  const categoryMatch = interaction.customId.match(/^points_create_modal_(.+)$/);
  const category = categoryMatch ? categoryMatch[1] : null;

  if (!category) {
    await safeReply(interaction, { content: "⚠️ Unknown category.", ephemeral: true });
    return;
  }

  const fromRaw = interaction.fields.getTextInputValue("week_from");
  const toRaw = interaction.fields.getTextInputValue("week_to");

  const fromParsed = parseWeekDate(fromRaw);
  const toParsed = parseWeekDate(toRaw);

  if (!fromParsed || !toParsed) {
    await safeReply(interaction, {
      content: "❌ Invalid date format. Use DD/MM, DD/MM HH:mm or DDMM.",
      ephemeral: true
    });
    return;
  }

  const weekName = formatWeekName(fromParsed, toParsed);

  try {
    await pointsService.createWeek(category === "donations" ? "Donations" : "Duel", weekName);

    await safeReply(interaction, {
      content: `🟢 Created new week: **${weekName}** for category **${category}**`,
      ephemeral: true
    });

    // Po stworzeniu tygodnia renderujemy nowe przyciski
    if (category === "donations") {
      const weekRows = await pointsDonations.renderWeeks();
      await interaction.editReply({
        content: `📅 Donations – Select a week or create a new one:`,
        components: [...weekRows, new ActionRowBuilder<ButtonBuilder>().addComponents(pointsDonations.createWeekButton("donations"))]
      });
    }

  } catch (error) {
    console.error("Create Week error:", error);
    await safeReply(interaction, { content: "❌ Failed to create week.", ephemeral: true });
  }
}