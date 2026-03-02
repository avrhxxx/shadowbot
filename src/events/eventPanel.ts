import { Client, Interaction, ModalSubmitInteraction, TextChannel, SelectMenuInteraction, MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js";
import fs from "fs";
import path from "path";

const eventsFile = path.join(__dirname, "../data/events.json");
let events: any[] = [];
let defaultNotifyChannelId: string | null = null;

try {
    events = JSON.parse(fs.readFileSync(eventsFile, "utf-8"));
} catch {
    events = [];
}

// Zapisz wszystkie eventy
function saveEvents() {
    fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
}

// Sprawdzenie czy event miniony
function isPastEvent(event: any) {
    const now = new Date();
    const eventDate = new Date(now.getFullYear(), event.month - 1, event.day, event.hour, event.minute);
    return eventDate.getTime() + (event.reminderMinutes || 0) * 60000 < now.getTime();
}

// Wyświetlenie panelu eventów
export async function handleButton(interaction: Interaction) {
    if (!interaction.isButton()) return;

    const activeEvents = events.filter(e => !isPastEvent(e));
    const pastEvents = events.filter(e => isPastEvent(e));

    const rows = [
        new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("create_event")
                .setLabel("Create Event")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("manual_reminder")
                .setLabel("🔔 Manual Reminder")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId("cancel_event")
                .setLabel("🗑 Cancel Event")
                .setStyle("DANGER"),
            new MessageButton()
                .setCustomId("download_participants")
                .setLabel("⬇ Download Participants")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId("set_notify_channel")
                .setLabel("⚙ Set Notify Channel")
                .setStyle("SECONDARY")
        )
    ];

    await interaction.reply({
        content: "📌 Event Panel",
        components: rows,
        ephemeral: true
    });
}

// Obsługa modala tworzenia eventu
export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
    if (interaction.customId !== "modal_create_event") return;

    const name = interaction.fields.getTextInputValue("event_name");
    const day = parseInt(interaction.fields.getTextInputValue("event_day"));
    const month = parseInt(interaction.fields.getTextInputValue("event_month"));
    const hour = parseInt(interaction.fields.getTextInputValue("event_hour"));
    const minute = parseInt(interaction.fields.getTextInputValue("event_minute"));
    const reminderMinutes = parseInt(interaction.fields.getTextInputValue("event_reminder_minutes"));

    if (events.find(e => e.name === name)) {
        await interaction.reply({ content: "An event with this name already exists.", ephemeral: true });
        return;
    }

    events.push({ name, day, month, hour, minute, reminderMinutes, participants: [] });
    saveEvents();

    await interaction.reply({ content: `Event '${name}' created successfully!`, ephemeral: true });
}

// Ustawianie domyślnego kanału powiadomień
export async function handleSelectMenu(interaction: SelectMenuInteraction) {
    if (interaction.customId === "select_notify_channel") {
        defaultNotifyChannelId = interaction.values[0];
        await interaction.reply({ content: `Default notify channel set!`, ephemeral: true });
    }
}

// Obsługa dzwoneczka, kosza i download
export async function handleExtraButton(interaction: Interaction, client: Client) {
    if (!interaction.isButton()) return;
    if (!interaction.guild) return;

    const activeEvents = events.filter(e => !isPastEvent(e));
    const pastEvents = events.filter(e => isPastEvent(e));

    if (interaction.customId === "manual_reminder") {
        if (!defaultNotifyChannelId) {
            await interaction.reply({ content: "Default notify channel not set.", ephemeral: true });
            return;
        }
        const channel = await client.channels.fetch(defaultNotifyChannelId);
        if (channel?.isTextBased()) {
            for (const event of activeEvents) {
                await channel.send(`🔔 Reminder: Event '${event.name}' starts in ${event.reminderMinutes} minutes!`);
            }
            await interaction.reply({ content: "Manual reminders sent.", ephemeral: true });
        }
    }

    if (interaction.customId === "cancel_event") {
        if (activeEvents.length === 0) {
            await interaction.reply({ content: "No active events to cancel.", ephemeral: true });
            return;
        }
        activeEvents.forEach(e => events.splice(events.indexOf(e), 1));
        saveEvents();
        await interaction.reply({ content: `Canceled ${activeEvents.length} active event(s).`, ephemeral: true });
    }

    if (interaction.customId === "download_participants") {
        if (pastEvents.length === 0) {
            await interaction.reply({ content: "No past events available.", ephemeral: true });
            return;
        }
        for (const event of pastEvents) {
            const participants = event.participants.join("\n") || "No participants.";
            if (interaction.channel?.isTextBased()) {
                await interaction.channel.send(`📄 Participants for '${event.name}':\n${participants}`);
            }
        }
        await interaction.reply({ content: "Participants lists sent.", ephemeral: true });
    }
}

// Eksportujemy alias dla ModeratorPanel
export const handleEventButton = handleButton;