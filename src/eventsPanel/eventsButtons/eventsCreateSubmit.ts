// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import { ModalSubmitInteraction, Guild, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";
import { sendEventCreatedNotification } from "./eventsReminder";
import { getEventDateUTC } from "../../utils/timeUtils";

/**
 * Parsuje różne dopuszczalne formaty daty i czasu na day/month/hour/minute
 * Obsługiwane formaty:
 * DD.MM HH:MM, DD/MM HH:MM, DD-MM HH:MM
 * DD.MM HHMM, DD/MM HHMM, DD-MM HHMM
 * DDMM HHMM
 * DDMMHHMM
 * Dopuszczalny rok opcjonalnie jako osobne pole
 */
function parseEventDateTime(input: string): { day: number; month: number; hour: number; minute: number } | null {
    input = input.trim();
    if (!input) return null;

    const dateTimeRegex = /^(\d{1,2})(?:[.\-/]?)(\d{1,2})\s*(\d{2})(?::?(\d{2}))?$/;
    const match = input.match(dateTimeRegex);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const hour = parseInt(match[3], 10);
    const minute = match[4] ? parseInt(match[4], 10) : 0;

    if (hour > 23 || minute > 59) return null;

    const nowYear = new Date().getUTCFullYear();
    const testDate = new Date(Date.UTC(nowYear, month - 1, day));
    if (testDate.getUTCDate() !== day || testDate.getUTCMonth() !== month - 1) return null;

    return { day, month, hour, minute };
}

// Tymczasowe przechowywanie danych eventu dla przycisków Next Year / Cancel
const tempEventStore = new Map<string, {
    guildId: string;
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    reminderBefore?: number;
}>();

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const name = interaction.fields.getTextInputValue("event_name");
    const datetimeRaw = interaction.fields.getTextInputValue("event_datetime");
    const reminderRaw = interaction.fields.getTextInputValue("reminder_before");

    const reminderBefore = reminderRaw ? parseInt(reminderRaw, 10) : undefined;
    const parsed = parseEventDateTime(datetimeRaw);

    if (!name || !parsed) {
        await interaction.reply({
            content: "Invalid date/time input. Please use a valid format like 18.07 20:30 and check the calendar.",
            ephemeral: true
        });
        return;
    }

    let { day, month, hour, minute } = parsed;
    const nowUTC = new Date();
    let eventDateUTC = getEventDateUTC(day, month, hour, minute);

    // Jeśli data jest w przeszłości → zapytaj o przesunięcie na następny rok
    if (eventDateUTC.getTime() < nowUTC.getTime()) {
        const tempId = `${interaction.user.id}-${Date.now()}`;
        tempEventStore.set(tempId, { guildId, name, day, month, hour, minute, reminderBefore });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`next_year_yes_${tempId}`)
                .setLabel("Yes, set for next year")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`next_year_no_${tempId}`)
                .setLabel("No, cancel")
                .setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({
            content: `The date ${day}/${month} ${hour}:${minute} UTC has already passed. Do you want to set the event for next year?`,
            components: [row],
            fetchReply: true,
            ephemeral: true
        });

        const filter = (i: any) => i.user.id === interaction.user.id && (i.customId.startsWith("next_year_yes") || i.customId.startsWith("next_year_no"));

        const collector = msg.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60_000 });

        collector.on("collect", async i => {
            const tempData = tempEventStore.get(tempId);
            if (!tempData) {
                await i.update({ content: "Temporary event data not found, please try again.", components: [], ephemeral: true });
                collector.stop();
                return;
            }

            if (i.customId.startsWith("next_year_yes")) {
                const nextYear = nowUTC.getUTCFullYear() + 1;
                const newEvent: EventObject = {
                    id: `${Date.now()}`,
                    guildId: tempData.guildId,
                    name: tempData.name,
                    day: tempData.day,
                    month: tempData.month,
                    hour: tempData.hour,
                    minute: tempData.minute,
                    status: "ACTIVE",
                    participants: [],
                    createdAt: Date.now(),
                    reminderSent: false,
                    started: false,
                    year: nextYear,
                    ...(tempData.reminderBefore !== undefined && { reminderBefore: tempData.reminderBefore })
                };

                const events = await getEvents(tempData.guildId);
                const duplicate = events.find(
                    e =>
                        e.day === tempData.day &&
                        e.month === tempData.month &&
                        e.hour === tempData.hour &&
                        e.minute === tempData.minute &&
                        e.status === "ACTIVE"
                );

                if (duplicate) {
                    await i.update({ content: "An active event at this UTC date and time already exists. Please choose another date/time.", components: [], ephemeral: true });
                    await i.followUp({ content: "Event creation cancelled.", ephemeral: true });
                    tempEventStore.delete(tempId);
                    collector.stop();
                    return;
                }

                await saveEvents(tempData.guildId, [...events, newEvent]);

                if (interaction.guild) {
                    await sendEventCreatedNotification(newEvent, interaction.guild as Guild);
                }

                await i.update({ content: `Event created for ${tempData.day}/${tempData.month} ${tempData.hour}:${tempData.minute} UTC next year.`, components: [], ephemeral: true });
                await i.followUp({ content: "Event successfully scheduled.", ephemeral: true });
            } else {
                await i.update({ content: "Event was not added.", components: [], ephemeral: true });
                await i.followUp({ content: "Event creation cancelled.", ephemeral: true });
            }

            tempEventStore.delete(tempId);
            collector.stop();
        });

        collector.on("end", () => {
            tempEventStore.delete(tempId);
        });

        return;
    }

    // Normalne tworzenie eventu w przyszłości
    const events: EventObject[] = await getEvents(guildId);
    const duplicate = events.find(
        e =>
            e.day === day &&
            e.month === month &&
            e.hour === hour &&
            e.minute === minute &&
            e.status === "ACTIVE"
    );

    if (duplicate) {
        await interaction.reply({
            content: "An active event at this UTC date and time already exists. Please choose another date/time.",
            ephemeral: true
        });
        return;
    }

    const newEvent: EventObject = {
        id: `${Date.now()}`,
        guildId,
        name,
        day,
        month,
        hour,
        minute,
        status: "ACTIVE",
        participants: [],
        createdAt: Date.now(),
        reminderSent: false,
        started: false,
        ...(reminderBefore !== undefined && { reminderBefore })
    };

    await saveEvents(guildId, [...events, newEvent]);

    if (interaction.guild) {
        await sendEventCreatedNotification(newEvent, interaction.guild as Guild);
    }

    await interaction.reply({
        content: "Event created successfully!",
        ephemeral: true
    });
}