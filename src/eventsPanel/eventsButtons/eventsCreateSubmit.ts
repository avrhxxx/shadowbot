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
function parseEventDateTime(input: string): { day: number; month: number; year?: number; hour: number; minute: number } | null {
    input = input.trim();
    if (!input) return null;

    const dateTimeRegex = /^(\d{1,2})(?:[.\-/]?)(\d{1,2})\s*(\d{2})(?::?(\d{2}))?$/;
    const match = input.match(dateTimeRegex);
    if (!match) return null;

    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let hour = parseInt(match[3], 10);
    let minute = match[4] ? parseInt(match[4], 10) : 0;

    if (hour > 23 || minute > 59) return null;

    const nowYear = new Date().getUTCFullYear();
    const testDate = new Date(Date.UTC(nowYear, month - 1, day));
    if (testDate.getUTCDate() !== day || testDate.getUTCMonth() !== month - 1) return null;

    return { day, month, hour, minute };
}

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

    // Sprawdzenie, czy data jest w przeszłości
    if (eventDateUTC.getTime() < nowUTC.getTime()) {
        // Tworzymy wiadomość z przyciskami Tak/Nie
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("next_year_yes")
                .setLabel("Tak, ustaw na następny rok")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("next_year_no")
                .setLabel("Nie, anuluj")
                .setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({
            content: `Data ${day}/${month} ${hour}:${minute} UTC już minęła. Chcesz ustawić event na przyszły rok?`,
            components: [row],
            ephemeral: true,
            fetchReply: true
        });

        // Czekamy na interakcję z przycisków
        const filter = (i: any) => ["next_year_yes", "next_year_no"].includes(i.customId) && i.user.id === interaction.user.id;
        try {
            const collector = msg.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60_000 });

            collector.on("collect", async i => {
                if (i.customId === "next_year_yes") {
                    const nextYear = nowUTC.getUTCFullYear() + 1;
                    eventDateUTC = new Date(Date.UTC(nextYear, month - 1, day, hour, minute));

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
                        await i.update({ content: "An active event at this UTC date and time already exists. Please choose another date/time.", components: [], ephemeral: true });
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

                    await i.update({ content: `Event utworzony na ${day}/${month} ${hour}:${minute} UTC w przyszłym roku.`, components: [], ephemeral: true });
                } else {
                    await i.update({ content: "Event nie został dodany.", components: [], ephemeral: true });
                }
                collector.stop();
            });
        } catch {
            await interaction.followUp({ content: "Nie otrzymano odpowiedzi w czasie 60 sekund. Event anulowany.", ephemeral: true });
        }

        return;
    }

    // Normalne tworzenie eventu, jeśli data w przyszłości
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