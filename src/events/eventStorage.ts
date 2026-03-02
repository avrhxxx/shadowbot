import fs from "fs";
import path from "path";

const filePath = path.join(__dirname, "..", "data", "events.json");

export interface StoredEvent {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  channelId: string;
  participants: string[];
  createdAt: number;
  cancelled?: boolean;
}

interface EventFileSchema {
  events: StoredEvent[];
  config: {
    defaultChannelId: string | null;
  };
}

function ensureFileExists() {
  if (!fs.existsSync(filePath)) {
    const initialData: EventFileSchema = {
      events: [],
      config: {
        defaultChannelId: null,
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
}

function readFile(): EventFileSchema {
  ensureFileExists();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeFile(data: EventFileSchema) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export const eventStorage = {
  getAllEvents(): StoredEvent[] {
    return readFile().events;
  },

  saveAllEvents(events: StoredEvent[]) {
    const file = readFile();
    file.events = events;
    writeFile(file);
  },

  getConfig() {
    return readFile().config;
  },

  setDefaultChannel(channelId: string | null) {
    const file = readFile();
    file.config.defaultChannelId = channelId;
    writeFile(file);
  },
};