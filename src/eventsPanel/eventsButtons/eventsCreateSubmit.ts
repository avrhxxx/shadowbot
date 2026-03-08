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

import { getEvents, saveEvents, EventObject } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";
import { sendEventCreatedNotification } from "./eventsReminder";

// -----------------------------------------------------------
// TEMP DATA TYPE
// -----------------------------------------------------------
export type TempEventData = {
    id: string; // unikalne ID eventu
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    guildId: string;
    year?: number;
    reminderBefore?: number;
    notifyOnCreate?: boolean;
};

// -----------------------------------------------------------
// TEMP STORE
// -----------------------------------------------------------
export const tempEventStore = new Map<string, TempEventData>();

// -----------------------------------------------------------
// HELPERS
// -----------------------------------------------------------
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

// -----------------------------------------------------------
// SAFE REPLY (obsługa flags zamiast przestarzałego ephemeral)
// -----------------------------------------------------------
async function safeReply(interaction: any, payload: any) {
    if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
    if ("update" in interaction && typeof interaction.update === "function") return interaction.update(payload);

    if (payload.ephemeral) {
        payload.flags = 64; // Discord API: EPHEMERAL
        delete payload.ephemeral;
    }

    return interaction.reply(payload);
}

// -----------------------------------------------------------
// HANDLE CREATE SUBMIT
// -----------------------------------------------------------
export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const name = interaction.fields.getTextInputValue("event_name");
    const datetimeRaw = interaction.fields.getTextInputValue("event_datetime");
    const yearRaw = interaction.fields.getTextInputValue("event_year");

    const parsed = parseEventDateTime(datetimeRaw);
    if (!name || !parsed) {
        if (canReply(interaction)) {
            await safeReply(interaction, { content: "Invalid date/time format.", ephemeral: true });
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

    const tempId = `E-${uuidv4()}`; // unikalne ID dla tego eventu

    // przypadek daty w przeszłości
    if (!year && eventDateUTC.getTime() < nowUTC.getTime()) {
        tempEventStore.set(tempId, { id: tempId, name, day, month, hour, minute, guildId });
        await safeReply(interaction, {
            content: `The date ${formatEventUTC(day, month, hour, minute)} has passed. Do you want to schedule it for next year?`,
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

    // zapis tymczasowy + reminderBefore 60 minut
    tempEventStore.set(tempId, {
        id: tempId,
        name,
        day,
        month,
        hour,
        minute,
        guildId,
        year: year ?? eventDateUTC.getUTCFullYear(),
        reminderBefore: 60
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
export async function finalizeEvent(interaction: ButtonInteraction | StringSelectMenuInteraction, tempId: string) {
    const tempData = tempEventStore.get(tempId);
    if (!tempData) {
        await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
        return;
    }

    const events: EventObject[] = await getEvents(tempData.guildId);
    const newEvent: EventObject = {
        id: tempData.id,
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
        reminderBefore: tempData.reminderBefore
    };

    await saveEvents(tempData.guildId, [...events, newEvent]);
    tempEventStore.delete(tempId);

    if (interaction.guild && tempData.notifyOnCreate) {
        await sendEventCreatedNotification(newEvent, interaction.guild);
    }

    await safeReply(interaction, { content: `Event **${newEvent.name}** scheduled successfully.`, components: [], ephemeral: true });
}

// -----------------------------------------------------------
// HANDLE NOTIFICATION RESPONSE
// -----------------------------------------------------------
export async function handleNotificationResponse(interaction: ButtonInteraction) {
    const [, tempId] = interaction.customId.split(/-(.+)/); // <- poprawione
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
    const [, tempId] = interaction.customId.split(/-(.+)/); // <- poprawione
    const tempData = tempEventStore.get(tempId);
    if (!tempData) {
        await safeReply(interaction, { content: "Temporary event data not found.", components: [], ephemeral: true });
        return;
    }

    tempData.year = new Date().getUTCFullYear() + 1;
    await showCreateNotificationConfirm(interaction, tempId);
}