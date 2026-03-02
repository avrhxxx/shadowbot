// src/modules/EventModule.ts
import { Client, Message, TextChannel, NewsChannel, ThreadChannel } from "discord.js";
import fs from "fs";
import path from "path";

interface EventParticipant {
    nick: string;
    present: boolean;
}

interface EventData {
    id: string;
    alliance: string;
    name: string;
    timestamp: number;
    participants: EventParticipant[];
}

const DATA_PATH = path.join(__dirname, "../data/events.json");

// Wczytanie istniejących eventów
function loadEvents(): EventData[] {
    try {
        const raw = fs.readFileSync(DATA_PATH, "utf-8");
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

// Zapis eventów
function saveEvents(events: EventData[]) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

// Funkcja wysyłająca wiadomości tylko jeśli kanał ma send()
async function safeSend(channel: any, content: any) {
    if (!channel) return;
    if ("send" in channel && typeof channel.send === "function") {
        return channel.send(content);
    }
}

export function initEventModule(client: Client) {
    client.on("messageCreate", async (message: Message) => {
        if (!message.guild || message.author.bot) return;
        if (message.content.startsWith("!")) return; // nie reagujemy na komendy innych modułów

        const args = message.content.trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();
        if (!command) return;

        const channel = message.channel as TextChannel | NewsChannel | ThreadChannel;

        // Tworzenie eventu: !event create <alliance> <name> <YYYY-MM-DD_HH:MM>
        if (command === "!event" && args[0]?.toLowerCase() === "create") {
            const [ , alliance, name, datetime ] = args;
            if (!alliance || !name || !datetime) {
                return safeSend(channel, "Usage: !event create <alliance> <name> <YYYY-MM-DD_HH:MM>");
            }

            const timestamp = new Date(datetime.replace("_","T")).getTime();
            if (isNaN(timestamp)) return safeSend(channel, "Invalid date format.");

            const events = loadEvents();
            const id = `event_${Date.now()}`;
            events.push({ id, alliance, name, timestamp, participants: [] });
            saveEvents(events);

            safeSend(channel, `Event **${name}** for alliance **${alliance}** created!`);

            // Przypomnienia 1h i 10min przed
            const now = Date.now();

            const scheduleReminder = (delay: number, text: string) => {
                setTimeout(() => safeSend(channel, text), delay);
            };

            const delay1h = timestamp - now - 3600_000;
            if (delay1h > 0) scheduleReminder(delay1h, `Reminder: Event **${name}** starts in 1 hour!`);

            const delay10min = timestamp - now - 600_000;
            if (delay10min > 0) scheduleReminder(delay10min, `Reminder: Event **${name}** starts in 10 minutes!`);
        }

        // Dodawanie uczestników: !event add <eventID> <nick>
        if (command === "!event" && args[0]?.toLowerCase() === "add") {
            const [ , eventId, nick ] = args;
            if (!eventId || !nick) return safeSend(channel, "Usage: !event add <eventID> <nick>");

            const events = loadEvents();
            const event = events.find(e => e.id === eventId);
            if (!event) return safeSend(channel, "Event not found.");

            if (!event.participants.some(p => p.nick === nick)) {
                event.participants.push({ nick, present: true });
                saveEvents(events);
                safeSend(channel, `${nick} added to event **${event.name}**.`);
            } else {
                safeSend(channel, `${nick} is already in this event.`);
            }
        }

        // Usuwanie uczestników: !event remove <eventID> <nick>
        if (command === "!event" && args[0]?.toLowerCase() === "remove") {
            const [ , eventId, nick ] = args;
            if (!eventId || !nick) return safeSend(channel, "Usage: !event remove <eventID> <nick>");

            const events = loadEvents();
            const event = events.find(e => e.id === eventId);
            if (!event) return safeSend(channel, "Event not found.");

            event.participants = event.participants.filter(p => p.nick !== nick);
            saveEvents(events);
            safeSend(channel, `${nick} removed from event **${event.name}**.`);
        }

        // Lista uczestników: !event list <eventID>
        if (command === "!event" && args[0]?.toLowerCase() === "list") {
            const [ , eventId ] = args;
            if (!eventId) return safeSend(channel, "Usage: !event list <eventID>");

            const events = loadEvents();
            const event = events.find(e => e.id === eventId);
            if (!event) return safeSend(channel, "Event not found.");

            const present = event.participants.filter(p => p.present).map(p => p.nick);
            const absent = event.participants.filter(p => !p.present).map(p => p.nick);

            safeSend(channel, `**${event.name}** Participants:\nPresent: ${present.join(", ") || "none"}\nAbsent: ${absent.join(", ") || "none"}`);
        }

        // Oznaczanie nieobecnych: !event markabsent <eventID> <nick>
        if (command === "!event" && args[0]?.toLowerCase() === "markabsent") {
            const [ , eventId, nick ] = args;
            if (!eventId || !nick) return safeSend(channel, "Usage: !event markabsent <eventID> <nick>");

            const events = loadEvents();
            const event = events.find(e => e.id === eventId);
            if (!event) return safeSend(channel, "Event not found.");

            const participant = event.participants.find(p => p.nick === nick);
            if (participant) {
                participant.present = false;
                saveEvents(events);
                safeSend(channel, `${nick} marked as absent for event **${event.name}**.`);
            } else {
                safeSend(channel, `${nick} is not part of this event.`);
            }
        }
    });
}