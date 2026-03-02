import { 
    Client, 
    ButtonInteraction, 
    ModalSubmitInteraction, 
    TextChannel, 
    NewsChannel,
    CacheType,
    Guild
} from "discord.js";
import fs from "fs";
import path from "path";

interface EventData {
    id: string;
    name: string;
    day: number;
    month: number;
    hour: number;
    minute: number;
    channelId?: string;
    reminderMinutes?: number;
    participants: string[];
}

const eventsFilePath = path.join(__dirname, "../data/events.json");
let events: EventData[] = [];

// Load events
if (fs.existsSync(eventsFilePath)) {
    events = JSON.parse(fs.readFileSync(eventsFilePath, "utf-8"));
}

// Save events helper
function saveEvents() {
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
}

// Type guard for sending messages safely
function isTextSendable(channel: any): channel is TextChannel | NewsChannel {
    return channel && typeof channel.send === "function";
}

// Handle button clicks
export async function handleButton(interaction: ButtonInteraction<CacheType>, client: Client) {
    const customId = interaction.customId;

    if (customId.startsWith("event_")) {
        const eventId = customId.split("_")[1];
        const event = events.find(e => e.id === eventId);

        if (!event) {
            return interaction.reply({ content: "Event not found.", ephemeral: true });
        }

        if (customId.endsWith("notify")) {
            // Manual notification
            if (event.channelId) {
                const channel = interaction.guild?.channels.cache.get(event.channelId);
                if (isTextSendable(channel)) {
                    channel.send(`Reminder: Event "${event.name}" is starting soon!`);
                    return interaction.reply({ content: "Notification sent.", ephemeral: true });
                }
            }
            return interaction.reply({ content: "Notification channel not set.", ephemeral: true });
        }

        if (customId.endsWith("delete")) {
            // Delete active event
            events = events.filter(e => e.id !== eventId);
            saveEvents();
            return interaction.reply({ content: `Event "${event.name}" deleted.`, ephemeral: true });
        }

        // Add other button handling here...
    }
}

// Handle modal submit for creating event
export async function handleModalSubmit(interaction: ModalSubmitInteraction<CacheType>) {
    const name = interaction.fields.getTextInputValue("eventName");
    const day = parseInt(interaction.fields.getTextInputValue("eventDay"), 10);
    const month = parseInt(interaction.fields.getTextInputValue("eventMonth"), 10);
    const time = interaction.fields.getTextInputValue("eventTime"); // e.g. "19:30"
    const [hour, minute] = time.split(":").map(n => parseInt(n, 10));

    const eventId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newEvent: EventData = {
        id: eventId,
        name,
        day,
        month,
        hour,
        minute,
        participants: []
    };

    events.push(newEvent);
    saveEvents();

    return interaction.reply({ content: `Event "${name}" created!`, ephemeral: true });
}

// Helper to get list of active/past events
export function getEvents() {
    const now = new Date();
    return events.map(e => {
        const eventDate = new Date(now.getFullYear(), e.month - 1, e.day, e.hour, e.minute);
        return {
            ...e,
            isPast: eventDate.getTime() < now.getTime()
        };
    });
}