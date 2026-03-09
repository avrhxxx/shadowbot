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

const EVENT_TYPES = [
    { label: "Arcadian Conquest", value: "arcadian_conquest", prefillName: "Arcadian Conquest" },
    { label: "City Contest", value: "city_contest", prefillName: "City Contest" },
    { label: "Reservoir Raid", value: "reservoir_raid", prefillName: "Reservoir Raid" },
    { label: "Ghoulion Pursuit", value: "ghoulion_pursuit", prefillName: "Ghoulion Pursuit" },
    { label: "Birthdays", value: "birthdays" },
    { label: "Custom", value: "custom" }
];

// ----------------------------
// Step 1: show type select
// ----------------------------
export async function handleCreate(interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("event_type_select")
        .setPlaceholder("Select Event Type")
        .addOptions(EVENT_TYPES.map(t => ({ label: t.label, value: t.value })));

    await interaction.reply({
        content: "Please select the type of event you want to create:",
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)],
        ephemeral: true
    });
}

// ----------------------------
// Step 2: show modal based on type
// ----------------------------
export async function handleTypeSelect(interaction: StringSelectMenuInteraction) {
    if (!interaction.isStringSelectMenu()) return;

    const typeValue = interaction.values[0];
    const typeConfig = EVENT_TYPES.find(t => t.value === typeValue);
    if (!typeConfig) return;

    const modal = new ModalBuilder().setTitle("Create Event");

    if (typeValue === "birthdays") {
        modal.setCustomId("event_create_modal_birthdays"); // unikalny ID dla birthday

        const nickInput = new TextInputBuilder()
            .setCustomId("event_name")
            .setLabel("Enter the birthday player's nickname")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Nickname")
            .setRequired(true);

        const dateInput = new TextInputBuilder()
            .setCustomId("event_datetime")
            .setLabel("Date (Day/Month, UTC)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("DD/MM")
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput)
        );

    } else if (typeValue === "custom") {
        modal.setCustomId("event_create_modal_custom"); // unikalny ID dla custom

        const nameInput = new TextInputBuilder()
            .setCustomId("event_name")
            .setLabel("Event Name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const datetimeInput = new TextInputBuilder()
            .setCustomId("event_datetime")
            .setLabel("Date & Time (UTC)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("DD/MM HH:mm")
            .setRequired(true);

        const yearInput = new TextInputBuilder()
            .setCustomId("event_year")
            .setLabel("Year (optional)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Leave empty for current year")
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(yearInput)
        );

    } else {
        // standard events
        modal.setCustomId(`event_create_modal_standard_${typeValue}`);

        const datetimeInput = new TextInputBuilder()
            .setCustomId("event_datetime")
            .setLabel("Date & Time (UTC)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("DD/MM HH:mm")
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(datetimeInput)
        );
    }

    await interaction.showModal(modal);
}