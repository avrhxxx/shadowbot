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

    // Pole: nazwa eventu (required)
    const nameInput = new TextInputBuilder()
        .setCustomId("event_name")
        .setLabel("Event Name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    // Pole: data + godzina (required), placeholder krótki
    const datetimeInput = new TextInputBuilder()
        .setCustomId("event_datetime")
        .setLabel("Date & Time (UTC)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Enter date & time (see channel description for formats)")
        .setRequired(true);

    // Pole: opcjonalny rok
    const yearInput = new TextInputBuilder()
        .setCustomId("event_year")
        .setLabel("Year (optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Leave empty to auto-calculate the year")
        .setRequired(false);

    // Pole: opcjonalny reminder
    const reminderInput = new TextInputBuilder()
        .setCustomId("reminder_before")
        .setLabel("Reminder before (minutes, optional)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Leave empty if no reminder")
        .setRequired(false);

    // Dodanie pól do modala
    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(yearInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(reminderInput)
    );

    // Wyświetlenie modala po kliknięciu przycisku
    await interaction.showModal(modal);
}