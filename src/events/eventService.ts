import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const EVENTS_FILE = path.resolve("./data/events.json");
const CONFIG_FILE = path.resolve("./data/config.json");

export type EventStatus = "ACTIVE" | "PAST" | "CANCELLED";

export interface EventObject {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderBefore: number; // min
  status: EventStatus;
  participants: string[];
  createdAt: number;
  guildId: string;
  reminderSent?: boolean;
}

export interface GuildEvents {
  [guildId: string]: {
    events: EventObject[];
  };
}

export interface ConfigObject {
  [guildId: string]: {
    defaultChannelId?: string;
  };
}

// ======= EVENTS JSON =======
export function loadEvents(): GuildEvents {
  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify({}, null, 2));
  }
  return JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8"));
}

export function saveEvents(data: GuildEvents) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2));
}

// ======= CONFIG JSON =======
export function loadConfig(): ConfigObject {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

export function saveConfig(config: ConfigObject) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ======= EVENT CREATION =======
export function createEvent(
  guildId: string,
  name: string,
  day: number,
  month: number,
  hour: number,
  minute: number,
  reminderBefore: number
): EventObject {
  const now = new Date();
  let year = now.getFullYear();

  const eventDate = new Date(year, month - 1, day, hour, minute);
  if (eventDate.getTime() < Date.now()) {
    year += 1; // jeśli przeszłość, ustaw następny rok
  }

  const newEvent: EventObject = {
    id: uuidv4(),
    name,
    day,
    month,
    hour,
    minute,
    reminderBefore,
    status: "ACTIVE",
    participants: [],
    createdAt: Date.now(),
    guildId,
    reminderSent: false,
  };

  const allEvents = loadEvents();
  if (!allEvents[guildId]) allEvents[guildId] = { events: [] };
  allEvents[guildId].events.push(newEvent);
  saveEvents(allEvents);

  return newEvent;
}

// ======= GET EVENTS =======
export function getEvents(guildId: string): EventObject[] {
  const all = loadEvents();
  return all[guildId]?.events || [];
}

export function getActiveEvents(guildId: string): EventObject[] {
  return getEvents(guildId).filter(e => e.status === "ACTIVE");
}

export function getPastEvents(guildId: string): EventObject[] {
  return getEvents(guildId).filter(e => e.status === "PAST");
}

// ======= CANCEL EVENT =======
export function cancelEvent(guildId: string, eventId: string) {
  const all = loadEvents();
  const event = all[guildId]?.events.find(e => e.id === eventId);
  if (event) {
    event.status = "CANCELLED";
    saveEvents(all);
  }
}

// ======= UPDATE STATUS (PAST / REMINDERS) =======
export function updateEventStatuses(guildId: string) {
  const now = Date.now();
  const all = loadEvents();
  const events = all[guildId]?.events || [];

  for (const e of events) {
    const eventDate = new Date(
      new Date().getFullYear(),
      e.month - 1,
      e.day,
      e.hour,
      e.minute
    ).getTime();

    if (e.status === "ACTIVE" && now >= eventDate) {
      e.status = "PAST";
    }
  }

  saveEvents(all);
}

// ======= CONFIG =======
export function setDefaultChannel(guildId: string, channelId: string) {
  const config = loadConfig();
  if (!config[guildId]) config[guildId] = {};
  config[guildId].defaultChannelId = channelId;
  saveConfig(config);
}

export function getDefaultChannel(guildId: string): string | undefined {
  const config = loadConfig();
  return config[guildId]?.defaultChannelId;
}

// ======= GENERATE PARTICIPANTS FILE =======
export function generateParticipantsFile(guildId: string, eventId: string): string {
  const all = loadEvents();
  const event = all[guildId]?.events.find(e => e.id === eventId);
  if (!event) throw new Error("Event not found");

  const lines = [
    `Event: ${event.name}`,
    `Date: ${event.day}-${event.month} ${event.hour}:${event.minute}`,
    `Participants (${event.participants.length}):`,
    ...event.participants.map(id => id)
  ];

  const filePath = path.resolve(`./data/${event.id}_participants.txt`);
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  return filePath;
}