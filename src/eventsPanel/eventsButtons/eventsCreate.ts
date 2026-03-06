// src/eventsPanel/eventsButtons/eventsCreate.ts
import { 
    ButtonInteraction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} from "discord.js";

import { getConfig } from "../eventService"; // 🔹 zmieniony import

export async function handleCreate(interaction: ButtonInteraction) {
    // ✅ tylko dla przycisku
    if (!interaction.isButton()) return;

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

    // 🔹 Usunięto pole reminderInput z modala
    // Wszystkie pola dodajemy do modala
    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(yearInput)
    );

    // ✅ Wyświetlenie modala
    await interaction.showModal(modal);
}