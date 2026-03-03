import fs from "fs";
import path from "path";

const eventsPath = path.join(__dirname, "../data/events.json");
const configPath = path.join(__dirname, "../data/config.json");

export async function getEvents(guildId: string) {
  const data = readJSON(eventsPath);
  return data[guildId]?.events || [];
}

export async function saveEvents(guildId: string, events: any[]) {
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

function readJSON(filePath: string) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}