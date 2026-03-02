// src/modules/EventModule.ts
import { Client, Message } from "discord.js";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(__dirname, "../../data/events.json");

interface Event {
    id: string;
    name: string;
    guild: string;
    time: string;
    participants: string[];
}

interface EventsData {
    events: Event[];
}

function readEvents(): EventsData {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(DATA_PATH, JSON.stringify({ events: [] }, null, 2));
        }
        const raw = fs.readFileSync(DATA_PATH, "utf-8");
        return JSON.parse(raw) as EventsData;
    } catch (err) {
        console.error("Failed to read events.json:", err);
        return { events: [] };
    }
}

function writeEvents(data: EventsData) {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Failed to write events.json:", err);
    }
}

export function initEventModule(client: Client) {
    client.on("messageCreate", async (message: Message) => {
        if (message.author.bot || !message.inGuild()) return;

        const content = message.content.trim();
        const args = content.split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (command === "!event") {
            const sub = args.shift()?.toLowerCase();

            if (sub === "create") {
                const guild = args.shift();
                const name = args.join(" ");

                if (!guild || !name) {
                    message.reply("Usage: !event create <guild> <name>");
                    return;
                }

                const eventsData = readEvents();
                const id = `event${Date.now()}`;

                const newEvent: Event = {
                    id,
                    name,
                    guild,
                    time: new Date().toISOString(),
                    participants: []
                };

                eventsData.events.push(newEvent);
                writeEvents(eventsData);

                message.reply(`Event "${name}" created for guild "${guild}"!`);
            } else if (sub === "add") {
                const guild = args.shift();
                const nick = args.join(" ");

                if (!guild || !nick) {
                    message.reply("Usage: !event add <guild> <nick>");
                    return;
                }

                const eventsData = readEvents();
                const event = eventsData.events.find(e => e.guild === guild);
                if (!event) {
                    message.reply(`No event found for guild "${guild}".`);
                    return;
                }

                if (!event.participants.includes(nick)) {
                    event.participants.push(nick);
                    writeEvents(eventsData);
                    message.reply(`Added ${nick} to event "${event.name}"`);
                } else {
                    message.reply(`${nick} is already in the event.`);
                }
            } else if (sub === "remove") {
                const guild = args.shift();
                const nick = args.join(" ");

                if (!guild || !nick) {
                    message.reply("Usage: !event remove <guild> <nick>");
                    return;
                }

                const eventsData = readEvents();
                const event = eventsData.events.find(e => e.guild === guild);
                if (!event) {
                    message.reply(`No event found for guild "${guild}".`);
                    return;
                }

                event.participants = event.participants.filter(p => p !== nick);
                writeEvents(eventsData);
                message.reply(`Removed ${nick} from event "${event.name}"`);
            } else if (sub === "list") {
                const guild = args.shift();
                if (!guild) {
                    message.reply("Usage: !event list <guild>");
                    return;
                }

                const eventsData = readEvents();
                const event = eventsData.events.find(e => e.guild === guild);
                if (!event) {
                    message.reply(`No event found for guild "${guild}".`);
                    return;
                }

                message.reply(`Participants for "${event.name}": ${event.participants.join(", ") || "none"}`);
            } else {
                message.reply("Unknown subcommand. Use create/add/remove/list.");
            }
        }
    });
}