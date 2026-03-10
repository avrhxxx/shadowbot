// src/eventsPanel/eventsButtons/eventsCancel.ts
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { cancelEvent, getEvents } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

/* ======================================================
   🔹 STEP 1 – BUTTON → SELECT
====================================================== */
export async function handleCancel(interaction: ButtonInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const events = await getEvents(guildId);

  // ❌ Birthday events nie pojawią się w panelu
  const activeEvents = events.filter(
    e => e.status === "ACTIVE" && e.eventType !== "birthdays"
  );

  if (!activeEvents.length) {
    await interaction.reply({
      content: "No active events to cancel.",
      ephemeral: true
    });
    return;
  }

  const uniqueActiveEvents = Array.from(
    new Map(activeEvents.map(e => [e.id, e])).values()
  );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("event_cancel_select")
    .setPlaceholder("Select an event to cancel")
    .addOptions(
      uniqueActiveEvents.map(e => ({
        label: e.name,
        description: formatEventUTC(
          e.day,
          e.month,
          e.hour,
          e.minute,
          e.year
        ),
        value: e.id
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({
    content: "Select event to cancel:",
    components: [row],
    ephemeral: true
  });
}

/* ======================================================
   🔹 STEP 2 – SELECT → CONFIRMATION
====================================================== */
export async function handleCancelSelect(interaction: StringSelectMenuInteraction) {
  await interaction.deferUpdate();

  const guildId = interaction.guildId!;
  const eventId = interaction.values[0];

  const events = await getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.followUp({
      content: "Event not found.",
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Confirm Cancellation")
    .setDescription(
      `Are you sure you want to cancel **${event.name}**?\n\n` +
      `📅 ${formatEventUTC(
        event.day,
        event.month,
        event.hour,
        event.minute,
        event.year
      )}`
    )
    .setColor("Orange");

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`event_cancel_confirm_${eventId}`)
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Danger);

  const abortBtn = new ButtonBuilder()
    .setCustomId("event_cancel_abort")
    .setLabel("Abort")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, abortBtn);

  await interaction.editReply({
    content: "",
    embeds: [embed],
    components: [row]
  });
}

/* ======================================================
   🔹 STEP 3 – CONFIRM BUTTON
====================================================== */
export async function handleCancelConfirm(interaction: ButtonInteraction, eventId: string) {
  await interaction.deferUpdate();

  const guildId = interaction.guildId!;
  const event = await cancelEvent(guildId, eventId);

  if (!event) {
    await interaction.followUp({
      content: "Event not found.",
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Event Canceled")
    .setDescription(`**${event.name}** has been canceled.`)
    .setColor("Red");

  await interaction.editReply({
    content: "",
    embeds: [embed],
    components: []
  });
}

/* ======================================================
   🔹 STEP 4 – ABORT BUTTON
====================================================== */
export async function handleCancelAbort(interaction: ButtonInteraction) {
  await interaction.update({
    content: "Cancellation aborted.",
    embeds: [],
    components: []
  });
}