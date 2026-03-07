// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import {
    ModalSubmitInteraction,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuInteraction,
    ButtonInteraction,
    BaseInteraction
} from "discord.js";

import { getEvents, saveEvents, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";
import { sendEventCreatedNotification } from "./eventsReminder";
import { v4 as uuidv4 } from "uuid";

export type TempEventData = {
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    guildId: string;
    year?: number;
    reminderBefore?: number;
    notifyOnCreate?: boolean; // <-- nowa flaga
};

export const tempEventStore = new Map<string, TempEventData>();

function parseEventDateTime(input: string) {
    const match = input.trim().match(/^(\d{1,2})(?:[.\-/]?)(\d{1,2})\s*(\d{2})(?::?(\d{2}))?$/);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const hour = parseInt(match[3], 10);
    const minute = match[4] ? parseInt(match[4], 10) : 0;

    if (hour > 23 || minute > 59) return null;

    return { day, month, hour, minute };
}

function canReply(interaction: BaseInteraction): interaction is
    | ModalSubmitInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction {
    return "reply" in interaction;
}

async function safeReply(interaction: any, payload: any) {
    if (interaction.replied || interaction.deferred) {
        return interaction.editReply(payload);
    }
    if ("update" in interaction && typeof interaction.update === "function") {
        return interaction.update(payload);
    }
    return interaction.reply(payload);
}

// ============================================================
// GENERATE UNIQUE EVENT ID
// ============================================================
function generateEventId(): string {
    const now = new Date();
    const datePart =
        now.getUTCFullYear().toString() +
        String(now.getUTCMonth() + 1).padStart(2, "0") +
        String(now.getUTCDate()).padStart(2, "0") +
        "-" +
        String(now.getUTCHours()).padStart(2, "0") +
        String(now.getUTCMinutes()).padStart(2, "0");
    return `EVT-${datePart}-${uuidv4()}`;
}

// ============================================================
// HANDLE CREATE SUBMIT
// ============================================================
export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const name = interaction.fields.getTextInputValue("event_name");
    const datetimeRaw = interaction.fields.getTextInputValue("event_datetime");
    const yearRaw = interaction.fields.getTextInputValue("event_year");

    const parsed = parseEventDateTime(datetimeRaw);

    if (!name || !parsed) {
        if (canReply(interaction)) {
            await interaction.reply({
                content: "Invalid date/time format.",
                ephemeral: true
            });
        }
        return;
    }

    const { day, month, hour, minute } = parsed;
    const yearParsed = yearRaw ? parseInt(yearRaw, 10) : undefined;
    const year = Number.isNaN(yearParsed) ? undefined : yearParsed;
    const nowUTC = new Date();
    let eventDateUTC = year
        ? new Date(Date.UTC(year, month - 1, day, hour, minute))
        : getEventDateUTC(day, month, hour, minute);

    const tempKey = `${interaction.user.id}-temp`;

    if (!year && eventDateUTC.getTime() < nowUTC.getTime()) {
        tempEventStore.set(tempKey, { name, day, month, hour, minute, guildId });

        await interaction.reply({
            content: `The date ${formatEventUTC(day, month, hour, minute)} has passed. Do you want to schedule it for next year?`,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("next_year_yes")
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("next_year_no")
                        .setLabel("No")
                        .setStyle(ButtonStyle.Danger)
                )
            ],
            ephemeral: true
        });

        return;
    }

    tempEventStore.set(tempKey, {
        name,
        day,
        month,
        hour,
        minute,
        guildId,
        year: year ?? eventDateUTC.getUTCFullYear()
    });

    await showReminderSelect(interaction, tempKey);
}

// ============================================================
// SHOW REMINDER SELECT
// ============================================================
export async function showReminderSelect(
    interaction: ModalSubmitInteraction | ButtonInteraction | StringSelectMenuInteraction,
    tempKey: string
) {
    const tempData = tempEventStore.get(tempKey);

    if (!tempData) {
        await safeReply(interaction, {
            content: "Temporary event data not found.",
            components: []
        });
        return;
    }

    const options = [
        { label: "No reminder", value: "0" },
        { label: "5 min before", value: "5" },
        { label: "10 min before", value: "10" },
        { label: "15 min before", value: "15" },
        { label: "20 min before", value: "20" },
        { label: "30 min before", value: "30" },
        { label: "45 min before", value: "45" },
        { label: "1h before", value: "60" },
        { label: "1h30m before", value: "90" },
        { label: "2h before", value: "120" },
        { label: "3h before", value: "180" },
        { label: "6h before", value: "360" },
        { label: "12h before", value: "720" },
        { label: "24h before", value: "1440" }
    ];

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`reminder_select-${tempKey}`) // <- przekazujemy tempKey w customId
        .setPlaceholder("Set reminder before event (optional)")
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await safeReply(interaction, {
        content: `Event **${tempData.name}** created. Please select a reminder time:`,
        components: [row]
    });
}

// ============================================================
// SHOW CREATE NOTIFICATION CONFIRM
// ============================================================
export async function showCreateNotificationConfirm(
    interaction: ButtonInteraction | StringSelectMenuInteraction,
    tempKey: string
) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`notify_create_yes-${tempKey}`)
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`notify_create_no-${tempKey}`)
            .setLabel("No")
            .setStyle(ButtonStyle.Danger)
    );

    await safeReply(interaction, {
        content: "Do you want to send a notification about creating this event?",
        components: [row]
    });
}

// ============================================================
// FINALIZE EVENT
// ============================================================
export async function finalizeEvent(interaction: ButtonInteraction | StringSelectMenuInteraction, tempKey: string) {
    const tempData = tempEventStore.get(tempKey);
    if (!tempData) {
        await safeReply(interaction, {
            content: "Temporary event data not found.",
            components: []
        });
        return;
    }

    const events: EventObject[] = await getEvents(tempData.guildId);

    const newEvent: EventObject = {
        id: generateEventId(),
        guildId: tempData.guildId,
        name: tempData.name,
        day: tempData.day,
        month: tempData.month,
        hour: tempData.hour,
        minute: tempData.minute,
        year: tempData.year!,
        status: "ACTIVE",
        participants: [],
        absent: [],
        createdAt: Date.now(),
        reminderSent: false,
        started: false,
        ...(tempData.reminderBefore !== undefined && { reminderBefore: tempData.reminderBefore })
    };

    await saveEvents(tempData.guildId, [...events, newEvent]);
    tempEventStore.delete(tempKey);

    if (interaction.guild && tempData.notifyOnCreate) {
        await sendEventCreatedNotification(newEvent, interaction.guild);
    }

    await safeReply(interaction, {
        content: `Event **${newEvent.name}** scheduled successfully.`,
        components: []
    });
}

// ============================================================
// FINALIZE EVENT WITH REMINDER
// ============================================================
export async function finalizeEventWithReminder(interaction: StringSelectMenuInteraction) {
    const tempKey = interaction.customId.split("-")[1]; // <-- pobieramy tempKey z customId
    const tempData = tempEventStore.get(tempKey);

    if (!tempData) {
        await safeReply(interaction, {
            content: "Temporary event data not found.",
            components: []
        });
        return;
    }

    const reminderValue = parseInt(interaction.values[0], 10);
    tempData.reminderBefore = reminderValue > 0 ? reminderValue : undefined;

    // po przypomnieniu pokazujemy opcję powiadomienia
    await showCreateNotificationConfirm(interaction, tempKey);
}

// ============================================================
// HANDLE NOTIFICATION RESPONSE
// ============================================================
export async function handleNotificationResponse(interaction: ButtonInteraction) {
    const [action, tempKey] = interaction.customId.split("-")[0].split("_").concat(interaction.customId.split("-")[1]);
    const tempData = tempEventStore.get(tempKey);
    if (!tempData) {
        await safeReply(interaction, { content: "Temporary event data not found.", components: [] });
        return;
    }

    tempData.notifyOnCreate = action === "notify_create_yes";

    await finalizeEvent(interaction, tempKey);
}

// ============================================================
// FINALIZE NEXT YEAR EVENT
// ============================================================
export async function finalizeNextYearEvent(interaction: ButtonInteraction) {
    const tempKey = `${interaction.user.id}-temp`;
    const tempData = tempEventStore.get(tempKey);
    if (!tempData) {
        await safeReply(interaction, { content: "Temporary event data not found.", components: [] });
        return;
    }

    tempData.year = new Date().getUTCFullYear() + 1;
    await showReminderSelect(interaction, tempKey);
}