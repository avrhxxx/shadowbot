// src/events/eventStorage.ts
import fs from "fs";
import path from "path";

export interface EventData {
    id: string;
    name: string;
    timestamp: number;
    createdBy: string;
    participants?: { nick: string; present: boolean }[];
}

const DATA_PATH = path.join(__dirname, "../data/events.json");

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