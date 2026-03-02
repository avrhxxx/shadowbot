// src/events/eventStorage.ts
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

export function loadEvents(): EventData[] {
    try {
        if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "[]", "utf-8");
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as EventData[];
    } catch {
        return [];
    }
}

export function saveEvents(events: EventData[]) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(events, null, 2), "utf-8");
}