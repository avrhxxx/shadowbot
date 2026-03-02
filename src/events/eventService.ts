import { TextChannel, ButtonInteraction } from "discord.js";
import { loadEvents, saveEvents } from "./eventStorage";

interface EventData {
    id: string;
    title: string;
    description?: string;
    timestamp: number;
    participants: string[];
    createdBy: string;
}

// Generate simple ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/* ===== CREATE EVENT ===== */
export function createEvent(title: string, description: string, timestamp: number, creatorId: string) {
    const data = loadEvents();
    const event: EventData = {
        id: generateId(),
        title,
        description,
        timestamp,
        participants: [],
        createdBy: creatorId
    };
    data.events.push(event);
    saveEvents(data);
    return event;
}

/* ===== EXPORT PARTICIPANTS ===== */
export async function exportParticipants(eventId: string, channel: TextChannel) {
    const data = loadEvents();
    const event = data.events.find((e: EventData) => e.id === eventId);
    if (!event || !event.participants.length) return false;

    const list = event.participants.map((id, i) => `${i + 1}. <@${id}>`).join("\n");
    await channel.send(`📋 Participants for **${event.title}**\n\n${list}`);
    return true;
}

/* ===== ATTENDANCE STATISTICS ===== */
export function calculateAttendance(events: EventData[]) {
    const stats: Record<string, number> = {};
    for (const e of events) {
        for (const user of e.participants) {
            stats[user] = (stats[user] || 0) + 1;
        }
    }
    return stats;
}

/* ===== SMART SUGGESTION (inactive last 3 events) ===== */
export function findInactiveMembers(events: EventData[]) {
    const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
    const lastThree = sorted.slice(0, 3);
    if (!lastThree.length) return [];

    const allParticipants = new Set(events.flatMap(e => e.participants));
    const inactive: string[] = [];

    for (const user of allParticipants) {
        const attended = lastThree.some(e => e.participants.includes(user));
        if (!attended) inactive.push(user);
    }
    return inactive;
}

/* ===== PIN ACTIVE EVENT ===== */
export async function pinActiveEvent(event: EventData, channel: TextChannel) {
    const message = await channel.send(`📌 **${event.title}**\n<t:${Math.floor(event.timestamp / 1000)}:F>`);
    await message.pin();

    const pins = await channel.messages.fetchPinned();
    for (const msg of pins.values()) {
        if (msg.id !== message.id) await msg.unpin();
    }
}