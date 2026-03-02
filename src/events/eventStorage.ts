import fs from "fs";
const FILE_PATH = "./data/events.json";

export function loadEvents() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify({ events: [] }, null, 2));
    }
    const raw = fs.readFileSync(FILE_PATH);
    return JSON.parse(raw.toString());
}

export function saveEvents(data: any) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}