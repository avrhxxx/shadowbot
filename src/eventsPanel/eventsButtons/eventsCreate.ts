// src/eventsPanel/eventsButtons/eventsCreate.ts
import { 
    ButtonInteraction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} from "discord.js";

import * as EventStorage from "../eventStorage"; // 🔹 dodane

export async function handleCreate(interaction: ButtonInteraction) {
    // ✅ tylko dla przycisku
    if (!interaction.isButton()) return;

    // 🔹 sprawdzenie czy system jest skonfigurowany
    const config = await EventStorage.getConfig(interaction.guildId!);

    if (!config?.notificationChannelId || !config?.downloadChannelId) {
        await interaction.reply({
            content:
                "⚠️ Event system is not configured yet.\n\n" +
                "Please use the ⚙️ **Settings** button first and configure:\n" +
                "• Notification Channel\n" +
                "• Download Channel",
            ephemeral: true
        });
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId("event_create_modal")
        .setTitle("Create Event");

    // Pole: nazwa eventu (required)
    const nameInput = new TextInputBuilder()
        .setCustomId("event_name")
        .setLabel("Event Name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    // Pole: data + godzina (required)
    const datetimeInput = new TextInputBuilder()
        .setCustomId("event_datetime")
        .setLabel("Date & Time (UTC)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("See pinned message in this channel for formats")
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

    // ✅ Wyświetlenie modala
    await interaction.showModal(modal);
}