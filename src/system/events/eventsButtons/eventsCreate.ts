// src/eventsPanel/eventsButtons/eventsCreate.ts
import { 
    ButtonInteraction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    StringSelectMenuInteraction, 
    StringSelectMenuBuilder 
} from "discord.js";
import { createTraceId } from "../../../core/ids/IdGenerator";
import { logger } from "../../../core/logger/log";

const EVENT_TYPES = [
    { label: "Arcadian Conquest", value: "arcadian_conquest", prefillName: "Arcadian Conquest" },
    { label: "City Contest", value: "city_contest", prefillName: "City Contest" },
    { label: "Reservoir Raid", value: "reservoir_raid", prefillName: "Reservoir Raid" },
    { label: "Ghoulion Pursuit", value: "ghoulion_pursuit", prefillName: "Ghoulion Pursuit" },
    { label: "KvK", value: "kvk", prefillName: "KvK" },
    { label: "Birthdays", value: "birthdays" },
    { label: "Custom", value: "custom" }
];

// ----------------------------
// HELPERS TO CREATE INPUTS
// ----------------------------
function createDateInput(customId: string, labelText: string) {
    return new TextInputBuilder()
        .setCustomId(customId)
        .setLabel(labelText)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Available formats are in the message above the panel")
        .setRequired(true);
}

function createTextInput(customId: string, labelText: string, placeholder: string, required = true) {
    return new TextInputBuilder()
        .setCustomId(customId)
        .setLabel(labelText)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(placeholder)
        .setRequired(required);
}

// ----------------------------
// Step 1: show type select
// ----------------------------
export async function handleCreate(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;

    const traceId = createTraceId();

    try {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("event_type_select")
            .setPlaceholder("Select Event Type")
            .addOptions(EVENT_TYPES.map(t => ({ label: t.label, value: t.value })));

        await interaction.reply({
            content: "Please select the type of event you want to create:",
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)],
            ephemeral: true
        });

        logger.emit({
            scope: "events.create",
            event: "open_type_select",
            traceId,
            context: {
                userId: interaction.user.id,
                guildId: interaction.guildId,
            },
        });

    } catch (err) {
        logger.emit({
            scope: "events.create",
            event: "open_type_select_failed",
            traceId,
            level: "error",
            error: err,
        });
    }
}

// ----------------------------
// Step 2: show modal based on type
// ----------------------------
export async function handleTypeSelect(interaction: StringSelectMenuInteraction) {
    if (!interaction.isStringSelectMenu()) return;

    const traceId = createTraceId();

    const typeValue = interaction.values[0];
    const typeConfig = EVENT_TYPES.find(t => t.value === typeValue);

    if (!typeConfig) {
        logger.emit({
            scope: "events.create",
            event: "invalid_type",
            traceId,
            input: {
                typeValue,
            },
        });
        return;
    }

    try {
        const modal = new ModalBuilder().setTitle("Create Event");

        if (typeValue === "birthdays") {
            modal.setCustomId("event_create_modal_birthdays");

            const nickInput = createTextInput("event_name", "Enter Player Nickname", "Enter player nickname");
            const dateInput = createDateInput("event_datetime", "Date (Day, Month, UTC)");

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput)
            );

        } else if (typeValue === "custom") {
            modal.setCustomId("event_create_modal_custom");

            const nameInput = createTextInput("event_name", "Event Name", "Enter event name");
            const datetimeInput = createDateInput("event_datetime", "Date & Time (Day, Month, Hour, Minute, UTC)");
            const yearInput = createTextInput("event_year", "Year (optional)", "Leave empty for current year", false);

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(yearInput)
            );

        } else {
            const customId = typeValue === "kvk" 
                ? "event_create_modal_standard_kvk" 
                : `event_create_modal_standard_${typeValue}`;

            modal.setCustomId(customId);

            const datetimeInput = createDateInput("event_datetime", "Date & Time (Day, Month, Hour, Minute, UTC)");

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput)
            );
        }

        await interaction.showModal(modal);

        logger.emit({
            scope: "events.create",
            event: "modal_opened",
            traceId,
            context: {
                type: typeValue,
                userId: interaction.user.id,
                guildId: interaction.guildId,
            },
        });

    } catch (err) {
        logger.emit({
            scope: "events.create",
            event: "modal_open_failed",
            traceId,
            level: "error",
            context: {
                type: typeValue,
            },
            error: err,
        });
    }
}