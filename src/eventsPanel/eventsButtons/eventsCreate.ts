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

  // Pole: nazwa eventu (required)
  const nameInput = new TextInputBuilder()
    .setCustomId("event_name")
    .setLabel("Event Name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // Pole: data + godzina w jednym polu, z opisem dopuszczalnych formatów
  const datetimeInput = new TextInputBuilder()
    .setCustomId("event_datetime")
    .setLabel("Date & Time (UTC)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(
`Examples of acceptable formats:
DD.MM HH:MM   → 18.07 20:30
DD/MM HH:MM   → 18/07 20:30
DD-MM HH:MM   → 18-07 20:30
DD.MM HHMM    → 18.07 2030
DD/MM HHMM    → 18/07 2030
DD-MM HHMM    → 18-07 2030
DDMM HHMM     → 1807 2030
DDMMHHMM      → 18072030`
    )
    .setRequired(true);

  // Pole: rok (opcjonalny)
  const yearInput = new TextInputBuilder()
    .setCustomId("event_year")
    .setLabel("Year (optional)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Leave empty to auto-calculate the year")
    .setRequired(false);

  // Pole: reminder (opcjonalny)
  const reminderInput = new TextInputBuilder()
    .setCustomId("reminder_before")
    .setLabel("Reminder before (minutes, optional)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Leave empty if no reminder")
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(yearInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
  );

  // ✅ od razu pokazujemy modal po kliknięciu przycisku — dokładnie tak jak w starym pliku
  await interaction.showModal(modal);
}