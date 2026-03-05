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
import { EventObject, getEvents, saveEvents } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";
import { sendEventCreatedNotification } from "./eventsReminder";

export type TempEventData = {
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    guildId: string;
    year?: number;
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
    return 'reply' in interaction && typeof interaction.reply === 'function';
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const name = interaction.fields.getTextInputValue("event_name");
    const datetimeRaw = interaction.fields.getTextInputValue("event_datetime");
    const yearRaw = interaction.fields.getTextInputValue("event_year");

    const parsed = parseEventDateTime(datetimeRaw);
    if (!name || !parsed) {
        if (canReply(interaction)) await interaction.reply({ content: "Invalid date/time format.", ephemeral: true });
        return;
    }

    const { day, month, hour, minute } = parsed;
    const year = yearRaw ? parseInt(yearRaw, 10) : undefined;
    const nowUTC = new Date();
    let eventDateUTC = year
        ? new Date(Date.UTC(year, month - 1, day, hour, minute))
        : getEventDateUTC(day, month, hour, minute);

    const tempKey = `${interaction.user.id}-temp`;

    if (!year && eventDateUTC.getTime() < nowUTC.getTime()) {
        tempEventStore.set(tempKey, { name, day, month, hour, minute, guildId });
        if (canReply(interaction)) {
            await interaction.reply({
                content: `The date ${formatEventUTC(day, month, hour, minute)} has passed. Do you want to schedule it for next year?`,
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId("next_year_yes").setLabel("Yes").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId("next_year_no").setLabel("No").setStyle(ButtonStyle.Danger)
                    )
                ],
                ephemeral: true
            });
        }
        return;
    }

    tempEventStore.set(tempKey, { name, day, month, hour, minute, guildId, year: year ?? eventDateUTC.getUTCFullYear() });
    await showReminderSelect(interaction, tempKey);
}

export async function showReminderSelect(
    interaction: ModalSubmitInteraction | ButtonInteraction | StringSelectMenuInteraction, 
    tempKey: string
) {
    const tempData = tempEventStore.get(tempKey);
    if (!tempData) {
        if (canReply(interaction)) await interaction.reply({ content: "Temporary event data not found.", ephemeral: true });
        return;
    }

    // 🔹 Chronologiczne przypisanie wszystkich 25 slotów
    const options = [
        { label: "No reminder", value: "0" },
        { label: "5 min before", value: "5" },
        { label: "10 min before", value: "10" },
        { label: "15 min before", value: "15" },
        { label: "20 min before", value: "20" },
        { label: "25 min before", value: "25" },
        { label: "30 min before", value: "30" },
        { label: "35 min before", value: "35" },
        { label: "40 min before", value: "40" },
        { label: "45 min before", value: "45" },
        { label: "50 min before", value: "50" },
        { label: "55 min before", value: "55" },
        { label: "1h before", value: "60" },
        { label: "1h5m before", value: "65" },
        { label: "1h10m before", value: "70" },
        { label: "1h15m before", value: "75" },
        { label: "1h30m before", value: "90" },
        { label: "2h before", value: "120" },
        { label: "3h before", value: "180" },
        { label: "4h before", value: "240" },
        { label: "5h before", value: "300" },
        { label: "6h before", value: "360" },
        { label: "12h before", value: "720" },
        { label: "18h before", value: "1080" },
        { label: "24h before", value: "1440" }
    ];

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`reminder_select_${tempKey}`)
        .setPlaceholder("Set reminder before event (optional)")
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    if ('update' in interaction && typeof interaction.update === 'function') {
        await interaction.update({ content: `Event "${tempData.name}" created. Please select a reminder time:`, components: [row] });
    } else if (canReply(interaction)) {
        await interaction.reply({ content: `Event "${tempData.name}" created. Please select a reminder time:`, components: [row], ephemeral: true });
    }
}

export async function finalizeEventWithReminder(interaction: StringSelectMenuInteraction) {
    const tempKey = interaction.customId.replace("reminder_select_", "");
    const tempData = tempEventStore.get(tempKey);
    if (!tempData) {
        if ('update' in interaction && typeof interaction.update === 'function') await interaction.update({ content: "Temporary event data not found.", components: [] });
        else if (canReply(interaction)) await interaction.reply({ content: "Temporary event data not found.", ephemeral: true });
        return;
    }

    const reminderValue = parseInt(interaction.values[0], 10);
    const reminderBefore = reminderValue > 0 ? reminderValue : undefined;

    const events: EventObject[] = await getEvents(tempData.guildId);
    const newEvent: EventObject = {
        id: `${Date.now()}`,
        guildId: tempData.guildId,
        name: tempData.name,
        day: tempData.day,
        month: tempData.month,
        hour: tempData.hour,
        minute: tempData.minute,
        year: tempData.year!,
        status: "ACTIVE",
        participants: [],
        createdAt: Date.now(),
        reminderSent: false,
        started: false,
        ...(reminderBefore !== undefined && { reminderBefore })
    };

    await saveEvents(tempData.guildId, [...events, newEvent]);
    tempEventStore.delete(tempKey);

    if (interaction.guild) await sendEventCreatedNotification(newEvent, interaction.guild);

    if (interaction.replied || interaction.deferred) await interaction.editReply({ content: `Event "${newEvent.name}" scheduled successfully.`, components: [] });
    else if (canReply(interaction)) await interaction.reply({ content: `Event "${newEvent.name}" scheduled successfully.`, components: [], ephemeral: true });
}

export async function finalizeNextYearEvent(interaction: ButtonInteraction) {
    const tempKey = `${interaction.user.id}-temp`;
    const tempData = tempEventStore.get(tempKey);
    if (!tempData) {
        if (interaction.replied || interaction.deferred) await interaction.editReply({ content: "Temporary event data not found. Please try again.", components: [] });
        else if (canReply(interaction)) await interaction.reply({ content: "Temporary event data not found. Please try again.", ephemeral: true });
        return;
    }

    tempData.year = new Date().getUTCFullYear() + 1;
    await showReminderSelect(interaction, tempKey);
}