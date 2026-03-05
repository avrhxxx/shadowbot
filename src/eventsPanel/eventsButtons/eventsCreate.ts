import { 
    ButtonInteraction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} from "discord.js";

export async function handleCreate(interaction: ButtonInteraction) {
    // Tylko przycisk
    if (!interaction.isButton()) return;

    // Deferujemy interakcję, aby Discord nie wyświetlał "This interaction failed"
    await interaction.deferReply({ ephemeral: true });

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

    const yearInput = new TextInputBuilder()
        .setCustomId("event_year")
        .setLabel("Year (optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Leave empty to auto-calculate the year")
        .setRequired(false);

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

    await interaction.showModal(modal);
}