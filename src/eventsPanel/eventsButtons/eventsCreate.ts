// src/eventsPanel/eventsButtons/eventsCreate.ts
import { 
  ButtonInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} from "discord.js";

export async function handleCreate(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const modal = new ModalBuilder()
    .setCustomId("event_create_modal")
    .setTitle("Create Event");

  const nameInput = new TextInputBuilder()
    .setCustomId("event_name")
    .setLabel("Event Name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const dayInput = new TextInputBuilder()
    .setCustomId("event_day")
    .setLabel("Day (1-31, UTC)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter day in UTC")
    .setRequired(true);

  const monthInput = new TextInputBuilder()
    .setCustomId("event_month")
    .setLabel("Month (1-12, UTC)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter month in UTC")
    .setRequired(true);

  const timeInput = new TextInputBuilder()
    .setCustomId("event_time")
    .setLabel("Time (HH:MM UTC)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter time in UTC, e.g. 1:30, 13:00")
    .setRequired(true);

  const reminderInput = new TextInputBuilder()
    .setCustomId("reminder_before")
    .setLabel("Reminder before (minutes, optional)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Leave empty if no reminder")
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
  );

  await interaction.showModal(modal);
}