
import fs from "fs";
import path from "path";

export interface EventParticipant {
  nick: string;
  present: boolean;
}

export interface EventData {
  id: string;
  name: string;
  timestamp: number;
  participants: EventParticipant[];
}

const DATA_PATH = path.join(__dirname, "../../data/events.json");

/* ===================== LOAD / SAVE ===================== */
export function loadEvents(): EventData[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function saveEvents(events: EventData[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}

/* ===================== EVENT CREATION ===================== */
export function createEvent(name: string, timestamp: number): EventData {
  const events = loadEvents();
  const id = Date.now().toString();

  const newEvent: EventData = {
    id,
    name,
    timestamp,
    participants: [],
  };

  events.push(newEvent);
  saveEvents(events);
  return newEvent;
}

/* ===================== PARTICIPANTS ===================== */
export function addParticipant(eventId: string, nick: string) {
  const events = loadEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) throw new Error("Event not found");

  if (!event.participants.some(p => p.nick === nick)) {
    event.participants.push({ nick, present: true });
    saveEvents(events);
  }
}

export function removeParticipant(eventId: string, nick: string) {
  const events = loadEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) throw new Error("Event not found");

  event.participants = event.participants.filter(p => p.nick !== nick);
  saveEvents(events);
}

export function markAbsent(eventId: string, nick: string) {
  const events = loadEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) throw new Error("Event not found");

  const participant = event.participants.find(p => p.nick === nick);
  if (participant) {
    participant.present = false;
    saveEvents(events);
  }
}

/* ===================== STATISTICS ===================== */
export function calculateAttendance(events: EventData[]) {
  const stats: Record<string, number> = {};
  for (const event of events) {
    for (const p of event.participants) {
      if (!stats[p.nick]) stats[p.nick] = 0;
      if (p.present) stats[p.nick]++;
    }
  }
  return stats;
}

/* ===================== SMART SUGGESTION ===================== */
export function findInactiveMembers(events: EventData[], last = 3) {
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const recent = sorted.slice(0, last);

  if (recent.length < 1) return [];

  const allParticipants = new Set(events.flatMap(e => e.participants.map(p => p.nick)));
  const inactive: string[] = [];

  for (const nick of allParticipants) {
    const attended = recent.some(e => e.participants.some(p => p.nick === nick && p.present));
    if (!attended) inactive.push(nick);
  }

  return inactive;
}

/* ===================== UPCOMING / PAST ===================== */
export function getUpcomingEvents(): EventData[] {
  const now = Date.now();
  return loadEvents().filter(e => e.timestamp > now).sort((a,b)=>a.timestamp-b.timestamp);
}

export function getPastEvents(): EventData[] {
  const now = Date.now();
  return loadEvents().filter(e => e.timestamp <= now).sort((a,b)=>b.timestamp-a.timestamp);
}

/* ===================== PIN ACTIVE EVENT ===================== */
import { TextChannel, Message } from "discord.js";

export async function pinActiveEvent(channel: TextChannel, event: EventData) {
  const message = await channel.send(`📌 **${event.name}**\n<t:${Math.floor(event.timestamp/1000)}:F>`);
  await message.pin();

  const pins = await channel.messages.fetchPinned();
  for (const msg of pins.values()) {
    if (msg.id !== message.id) await msg.unpin();
  }
}

/* ===================== CLEAN OLD EVENTS ===================== */
export function cleanOldEvents() {
  const now = Date.now();
  const events = loadEvents().filter(e => e.timestamp > now);
  saveEvents(events);
  return events;
}