// src/eventsPanel/eventStorage.ts
import fs from "fs";
import path from "path";

// Folder danych w root projektu, poza dist, żeby deploy nie nadpisywał plików
const dataDir = path.join(__dirname, "../../data");
const eventsPath = path.join(dataDir, "events.json");
const configPath = path.join(dataDir, "config.json");

// Tworzymy folder i pliki, jeśli nie istnieją
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(eventsPath)) fs.writeFileSync(eventsPath, "{}");
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, "{}");

// Typ eventu (dla TypeScript)
export type EventObject = {
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  reminderBefore: number;
  status: "ACTIVE" | "PAST" | "CANCELLED";
  participants: string[];
  createdAt: number;
  guildId: string;
};

export async function getEvents(guildId: string): Promise<EventObject[]> {
  const data = readJSON(eventsPath);
  return data[guildId]?.events || [];
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  const data = readJSON(eventsPath);
  if (!data[guildId]) data[guildId] = { events: [] };
  data[guildId].events = events;
  writeJSON(eventsPath, data);
}

export async function getConfig(guildId: string) {
  const data = readJSON(configPath);
  return data[guildId] || {};
}

export async function saveConfig(guildId: string, config: any) {
  const data = readJSON(configPath);
  data[guildId] = config;
  writeJSON(configPath, data);
}

// --- Pomocnicze funkcje ---
function readJSON(filePath: string) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}