import { google } from "googleapis";

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("Brakuje zmiennej środowiskowej GOOGLE_SERVICE_ACCOUNT!");
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const SHEET_ID = "1SLBamj7aJzV0Uv7p_Lvn_qjihPuV_SqKPDkPYs-q0CE";
const EVENTS_TAB = "events";
const CONFIG_TAB = "config";

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ==========================
// UTILS
// ==========================
async function readSheet(tab: string): Promise<string[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tab,
  });
  return res.data.values || [];
}

async function writeSheet(tab: string, values: string[][]) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: tab,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// ==========================
// EVENT STORAGE
// ==========================
export type EventObject = {
  [key: string]: any;
  id: string;
  name: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
  year?: number;
  reminderBefore?: number;
  status: "ACTIVE" | "PAST" | "CANCELED";
  participants: string[];
  createdAt: number;
  guildId: string;
  reminderSent?: boolean;
  started?: boolean;
};

export async function getEvents(guildId: string): Promise<EventObject[]> {
  const rows = await readSheet(EVENTS_TAB);
  const headers = rows[0] || [];
  const data = rows.slice(1);

  return data
    .map(row => {
      const obj: any = {};
      headers.forEach((header, i) => (obj[header] = row[i]));
      obj.day = Number(obj.day);
      obj.month = Number(obj.month);
      obj.hour = Number(obj.hour);
      obj.minute = Number(obj.minute);
      obj.participants = obj.participants ? JSON.parse(obj.participants) : [];
      obj.createdAt = Number(obj.createdAt);
      obj.reminderSent = obj.reminderSent === "true";
      obj.started = obj.started === "true";
      return obj as EventObject;
    })
    .filter(e => e.guildId === guildId);
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  const rows = await readSheet(EVENTS_TAB);
  const headers = rows[0] || [
    "id","name","day","month","hour","minute","year","reminderBefore",
    "status","participants","createdAt","guildId","reminderSent","started",
  ];

  const otherRows = rows.slice(1).filter(row => row[headers.indexOf("guildId")] !== guildId);

  const newRows = events.map(e =>
    headers.map(h => {
      switch (h) {
        case "id": return e.id;
        case "name": return e.name;
        case "day": return e.day;
        case "month": return e.month;
        case "hour": return e.hour;
        case "minute": return e.minute;
        case "year": return e.year ?? "";
        case "reminderBefore": return e.reminderBefore ?? "";
        case "status": return e.status;
        case "participants": return JSON.stringify(e.participants);
        case "createdAt": return e.createdAt;
        case "guildId": return e.guildId;
        case "reminderSent": return e.reminderSent ? "true" : "false";
        case "started": return e.started ? "true" : "false";
        default: return e[h] ?? "";
      }
    })
  );

  await writeSheet(EVENTS_TAB, [headers, ...otherRows, ...newRows]);
}

// ==========================
// CONFIG STORAGE
// ==========================
export async function getConfig(guildId: string): Promise<any> {
  const rows = await readSheet(CONFIG_TAB);
  const headers = rows[0] || [];
  const data = rows.slice(1);

  const row = data.find(r => r[headers.indexOf("guildId")] === guildId);
  if (!row) return {};

  const obj: any = {};
  headers.forEach((h, i) => (obj[h] = row[i]));
  return obj;
}

export async function saveConfig(guildId: string, config: any) {
  const rows = await readSheet(CONFIG_TAB);
  const headers = rows[0] || ["guildId", ...Object.keys(config)];

  const otherRows = rows.slice(1).filter(r => r[headers.indexOf("guildId")] !== guildId);
  const newRow = headers.map(h => (h === "guildId" ? guildId : config[h] ?? ""));

  await writeSheet(CONFIG_TAB, [headers, ...otherRows, newRow]);
}