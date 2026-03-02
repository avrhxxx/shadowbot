
import fs from "fs";
import path from "path";
import { EventData } from "./eventService";

const DATA_PATH = path.join(__dirname, "../../data/events.json");

export function loadEventsFromFile(): EventData[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEventsToFile(events: EventData[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}