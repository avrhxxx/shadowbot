import fs from "fs";
import path from "path";
import { EventData } from "./eventService";

const DATA_PATH = path.join(__dirname, "../../data/events.json");

export function loadEventsFromFile(): EventData[] {
  // Tworzy folder i plik jeśli nie istnieje
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 2));
  }

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as EventData[];
}

export function saveEventsToFile(events: EventData[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}