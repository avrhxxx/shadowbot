// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import {
    ModalSubmitInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuInteraction,
    ButtonInteraction,
    BaseInteraction
} from "discord.js";
import { v4 as uuidv4 } from "uuid";

import { createEvent, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";
import { sendEventCreatedNotification } from "./eventsReminder";

// -----------------------------------------------------------
// TEMP DATA TYPE
// -----------------------------------------------------------
export type TempEventData = {
    id: string;
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    guildId: string;
    year?: number;
    reminderBefore?: number;
    notifyOnCreate?: boolean;
    eventType: string;
};

// -----------------------------------------------------------
// TEMP STORE
// -----------------------------------------------------------
export const tempEventStore = new Map<string, TempEventData>();

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
function parseEventDateTime(input: string) {
    const cleaned = input.trim();
    const match = cleaned.match(/^(\d{1,2})(?:[.\-/]?)(\d{1,2})\s*(\d{2})(?::?(\d{2}))?$/);
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
    if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
    if ("update" in interaction && typeof interaction.update === "function") return interaction.update(payload);

    if (payload.ephemeral) {
        payload.flags = 64;
        delete payload.ephemeral;
    }

    return interaction.reply(payload);
}

// -----------------------------------------------------------
// HANDLE CREATE SUBMIT
// -----------------------------------------------------------
export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const typeMatch = interaction.customId.match(/^event_create_modal_(.+)$/);
    const eventType = typeMatch ? typeMatch[1] : "custom";

    let name = "";
    let datetimeRaw = "";
    let yearRaw: string | undefined;

    try { name = interaction.fields.getTextInputValue("event_name"); } catch {}
    try { datetimeRaw = interaction.fields.getTextInputValue("event_datetime"); } catch {}
    try { yearRaw = interaction.fields.getTextInputValue("event_year"); } catch {}

    // Prefill dla standardowych typów
    const prefillMap: Record<string,string> = {
        arcadian_conquest: "Arcadian Conquest",
        city_contest: "City Contest",
        reservoir_raid: "Reservoir Raid",
        ghoulion_pursuit: "Ghoulion Pursuit"
    };
    if (prefillMap[eventType]) name = prefillMap[eventType];

    let day: number, month: number, hour = 0, minute = 0, year: number | undefined;

    if (eventType === "birthdays") {
        const dateMatch = datetimeRaw.trim().match(/^(\d{1,2})[./-]?(\d{1,2})$/);
        if (!dateMatch) {
            await safeReply(interaction, { content: "Invalid date format. Use DD/MM.", ephemeral: true });
            return;
        }
        day = parseInt(dateMatch[1], 10);
        month = parseInt(dateMatch[2], 10);
        hour = 0;
        minute = 0;
        year = new Date().getUTCFullYear();
    } else {
        const parsed = parseEventDateTime(datetimeRaw);
        if (!parsed || (!name && ["birthdays","custom"].includes(eventType))) {
            await safeReply(interaction, { content: "Invalid date/time format or missing name.", ephemeral: true });
            return;
        }
        day = parsed.day;
        month = parsed.month;
        hour = parsed.hour;
        minute = parsed.minute;
        const yearParsed = yearRaw ? parseInt(yearRaw, 10) : undefined;
        year = Number.isNaN(yearParsed) ? undefined : yearParsed;
    }

    const tempId = `E-${uuidv4()}`;

    // data w przeszłości – tylko Birthday i Custom bez roku
    const nowUTC = new Date();
    const eventDateUTC = year
        ? new Date(Date.UTC(year, month - 1, day, hour, minute))
        : getEventDateUTC(day, month, hour, minute);

    if ((eventType === "birthdays" || eventType === "custom") && !year && eventDateUTC.getTime() < nowUTC.getTime()) {
        tempEventStore.set(tempId, { id: tempId, name, day, month, hour, minute, guildId, eventType });
        await safeReply(interaction, {
            content: `The date ${formatEventUTC(day, month, hour, minute)} has passed. Schedule for next year?`,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId(`next_year_yes-${tempId}`).setLabel("Yes").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`next_year_no-${tempId}`).setLabel("No").setStyle(ButtonStyle.Danger)
                )
            ],
            ephemeral: true
        });
        return;
    }

    tempEventStore.set(tempId, {
        id: tempId,
        name,
        day,
        month,
        hour,
        minute,
        guildId,
        year: year ?? eventDateUTC.getUTCFullYear(),
        reminderBefore: eventType === "birthdays" ? 0 : 60,
        eventType
    });

    await showCreateNotificationConfirm(interaction, tempId);
}

// -----------------------------------------------------------
// SHOW CREATE NOTIFICATION CONFIRM
// -----------------------------------------------------------
export async function showCreateNotificationConfirm(
    interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
    tempId: string
) {
    const tempData = tempEventStore.get(tempId);
    if (!tempData) return;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`notify_create_yes-${tempId}`).setLabel("Yes").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`notify_create_no-${tempId}`).setLabel("No").setStyle(ButtonStyle.Danger)
    );

    await safeReply(interaction, {
        content: "Do you want to send a notification about creating this event?",
        components: [row],
        ephemeral: true
    });
}

// -----------------------------------------------------------
// FINALIZE EVENT
// -----------------------------------------------------------
export async function finalizeEvent(
    interaction: ButtonInteraction | StringSelectMenuInteraction,
    tempId: string
) {
    const tempData = tempEventStore.get(tempId);
    if (!tempData) {
        await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
        return;
    }

    const newEvent: EventObject = {
        id: tempData.id,
        guildId: tempData.guildId,
        name: tempData.name || "Unnamed Event",
        day: tempData.day,
        month: tempData.month,
        hour: tempData.hour,
        minute: tempData.minute,
        year: tempData.year ?? new Date().getUTCFullYear(),
        status: "ACTIVE",
        participants: [],
        absent: [],
        createdAt: Date.now(),
        reminderSent: false,
        started: false,
        reminderBefore: tempData.reminderBefore ?? 60,
        eventType: tempData.eventType || "custom"
    };

    await createEvent(newEvent);
    tempEventStore.delete(tempId);

    if (interaction.guild && tempData.notifyOnCreate) {
        await sendEventCreatedNotification(newEvent, interaction.guild);
    }

    await safeReply(interaction, {
        content: `Event **${newEvent.name}** scheduled successfully.`,
        components: [],
        ephemeral: true
    });
}

// -----------------------------------------------------------
// HANDLE NOTIFICATION RESPONSE
// -----------------------------------------------------------
export async function handleNotificationResponse(interaction: ButtonInteraction) {
    const [, tempId] = interaction.customId.split(/-(.+)/);
    const tempData = tempEventStore.get(tempId);
    if (!tempData) {
        await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
        return;
    }

    tempData.notifyOnCreate = interaction.customId.startsWith("notify_create_yes");
    await finalizeEvent(interaction, tempId);
}

// -----------------------------------------------------------
// FINALIZE NEXT YEAR EVENT
// -----------------------------------------------------------
export async function finalizeNextYearEvent(interaction: ButtonInteraction) {
    const [, tempId] = interaction.customId.split(/-(.+)/);
    const tempData = tempEventStore.get(tempId);
    if (!tempData) {
        await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
        return;
    }

    tempData.year = new Date().getUTCFullYear() + 1;
    await showCreateNotificationConfirm(interaction, tempId);
}