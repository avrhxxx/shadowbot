import { Client, Message, MessageFlags } from "discord.js";
import fs from "fs";
import path from "path";

interface EventParticipant {
    nick: string;
    present?: boolean; // opcjonalnie, jeśli będzie oznaczanie obecności
}

interface AllianceEvent {
    name: string;
    date: string; // ISO string
    participants: EventParticipant[];
}

interface EventsJSON {
    [allianceName: string]: AllianceEvent[];
}

const DATA_FILE = path.join(__dirname, "../data/events.json");

// Wczytywanie pliku JSON
function loadEvents(): EventsJSON {
    if (!fs.existsSync(DATA_FILE)) return {};
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as EventsJSON;
}

// Zapis pliku JSON
function saveEvents(data: EventsJSON) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function initEventModule(client: Client) {
    client.on("messageCreate", async (message: Message) => {
        if (message.author.bot || !message.inGuild()) return;

        const args = message.content.trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        const events = loadEvents();

        // Tworzenie eventu: !event create <AllianceName> <EventName> <YYYY-MM-DDTHH:MM>
        if (command === "!event" && args[0] === "create") {
            const [ , allianceName, eventName, eventDate ] = args;

            if (!allianceName || !eventName || !eventDate) {
                message.reply("Usage: !event create <AllianceName> <EventName> <YYYY-MM-DDTHH:MM>");
                return;
            }

            if (!events[allianceName]) events[allianceName] = [];

            events[allianceName].push({
                name: eventName,
                date: new Date(eventDate).toISOString(),
                participants: []
            });

            saveEvents(events);
            message.reply(`Event '${eventName}' for alliance '${allianceName}' created!`);
        }

        // Dodawanie uczestnika: !event add <AllianceName> <EventName> <Nick>
        if (command === "!event" && args[0] === "add") {
            const [ , allianceName, eventName, nick ] = args;

            if (!allianceName || !eventName || !nick) {
                message.reply("Usage: !event add <AllianceName> <EventName> <Nick>");
                return;
            }

            const allianceEvents = events[allianceName];
            if (!allianceEvents) {
                message.reply(`No events found for alliance '${allianceName}'`);
                return;
            }

            const event = allianceEvents.find(ev => ev.name === eventName);
            if (!event) {
                message.reply(`Event '${eventName}' not found for alliance '${allianceName}'`);
                return;
            }

            event.participants.push({ nick });
            saveEvents(events);
            message.reply(`Added '${nick}' to event '${eventName}'`);
        }

        // Wyświetlanie eventu: !event show <AllianceName> <EventName>
        if (command === "!event" && args[0] === "show") {
            const [ , allianceName, eventName ] = args;

            const allianceEvents = events[allianceName];
            if (!allianceEvents) return message.reply(`No events for '${allianceName}'`);

            const event = allianceEvents.find(ev => ev.name === eventName);
            if (!event) return message.reply(`Event '${eventName}' not found for alliance '${allianceName}'`);

            const participantList = event.participants.map(p => p.nick).join(", ") || "No participants yet";

            message.reply(`Event '${eventName}' participants: ${participantList}`);
        }
    });
}