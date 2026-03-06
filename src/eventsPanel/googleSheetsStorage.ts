// src/eventsPanel/googleSheetsStorage.ts
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const CREDENTIALS_PATH = path.join(__dirname, "../credentials/google-service.json");
const SPREADSHEET_ID = "TU_WKLEJ_ID_ARCUSZA_GOOGLE"; // wklej ID swojego arkusza

if (!fs.existsSync(CREDENTIALS_PATH)) throw new Error("Brak pliku z kluczem Google Service Account!");

// ==========================
// SETUP GOOGLE SHEETS
// ==========================
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

// ==========================
// TYPES
// ==========================
export type EventObject = {
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

// ==========================
// EVENTS
// ==========================
export async function getEvents(guildId: string): Promise<EventObject[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "events!A:Z"
  });

  const rows = res.data.values || [];
  if (!rows.length) return [];

  // Zakładamy nagłówek: guildId | id | name | day | month | hour | minute | year | status | participants (JSON) | createdAt | reminderSent | started
  const header = rows[0];
  const dataRows = rows.slice(1);
  return dataRows
    .filter(r => r[0] === guildId)
    .map(r => ({
      guildId: r[0],
      id: r[1],
      name: r[2],
      day: Number(r[3]),
      month: Number(r[4]),
      hour: Number(r[5]),
      minute: Number(r[6]),
      year: r[7] ? Number(r[7]) : undefined,
      status: r[8] as "ACTIVE" | "PAST" | "CANCELED",
      participants: r[9] ? JSON.parse(r[9]) : [],
      createdAt: Number(r[10]),
      reminderSent: r[11] === "true",
      started: r[12] === "true"
    }));
}

export async function saveEvents(guildId: string, events: EventObject[]) {
  // Pobierz wszystkie wiersze
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "events!A:Z"
  });
  const rows = res.data.values || [];
  const header = rows[0] || ["guildId","id","name","day","month","hour","minute","year","status","participants","createdAt","reminderSent","started"];
  const otherRows = rows.slice(1).filter(r => r[0] !== guildId); // zachowaj inne guildId

  const newRows = events.map(ev => [
    ev.guildId,
    ev.id,
    ev.name,
    ev.day.toString(),
    ev.month.toString(),
    ev.hour.toString(),
    ev.minute.toString(),
    ev.year ? ev.year.toString() : "",
    ev.status,
    JSON.stringify(ev.participants),
    ev.createdAt.toString(),
    ev.reminderSent ? "true" : "false",
    ev.started ? "true" : "false"
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "events!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [header, ...otherRows, ...newRows]
    }
  });
}

// ==========================
// CONFIG
// ==========================
export async function getConfig(guildId: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "config!A:B"
  });
  const rows = res.data.values || [];
  const conf: Record<string, any> = {};
  rows.forEach(r => {
    if (r[0] === guildId) {
      conf[guildId] = JSON.parse(r[1]);
    }
  });
  return conf[guildId] || {};
}

export async function saveConfig(guildId: string, config: any) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "config!A:B"
  });
  const rows = res.data.values || [];
  const header = ["guildId","config"];
  const otherRows = rows.slice(1).filter(r => r[0] !== guildId);

  const newRows = [
    [guildId, JSON.stringify(config)]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "config!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [header, ...otherRows, ...newRows]
    }
  });
}