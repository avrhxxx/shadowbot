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

  const datetimeInput = new TextInputBuilder()
    .setCustomId("event_datetime")
    .setLabel("Date & Time (UTC)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Examples: 18.07 20 | 18/07 20:30 | 18-07 2030")
    .setRequired(true);

  const reminderInput = new TextInputBuilder()
    .setCustomId("reminder_before")
    .setLabel("Reminder before (minutes, optional)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Leave empty if no reminder")
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
  );

  await interaction.showModal(modal);
}