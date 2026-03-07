import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID as string;
const CONFIG_TAB = "config";
const EVENTS_TAB = "events";

if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID env variable is missing");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// --------------------------
// CACHE
// --------------------------
let configCache: Record<string, any> | null = null;
let eventsCache: Record<string, any[]> | null = null;
let lastConfigFetch = 0;
let lastEventsFetch = 0;
const CACHE_TTL = 30 * 1000; // 30s

// --------------------------
// SHEET HELPERS
// --------------------------
async function readSheet(tab: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tab,
  });
  return res.data.values || [];
}

async function writeSheet(tab: string, values: any[][]) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// --------------------------
// CONFIG
// --------------------------
export async function getConfig(guildId: string) {
  const now = Date.now();
  if (configCache && now - lastConfigFetch < CACHE_TTL) {
    return configCache[guildId] || {};
  }

  const rows = await readSheet(CONFIG_TAB);
  const headers = rows[0] || [];
  const data = rows.slice(1);
  const map: Record<string, any> = {};

  for (const row of data) {
    const obj: any = {};
    headers.forEach((h: string, i: number) => {
      obj[h] = row[i] !== undefined && row[i] !== "" ? String(row[i]).trim() : null;
    });
    if (obj.guildId) map[obj.guildId] = obj;
  }

  configCache = map;
  lastConfigFetch = now;

  return map[guildId] || {};
}

export async function setConfig(guildId: string, key: string, value: string) {
  const rows = await readSheet(CONFIG_TAB);
  const headers = rows[0];
  const data = rows.slice(1);

  const guildIndex = headers.indexOf("guildId");
  const keyIndex = headers.indexOf(key);

  if (keyIndex === -1) throw new Error(`Column ${key} not found`);

  let rowIndex = data.findIndex(r => r[guildIndex] === guildId);

  if (rowIndex === -1) {
    const newRow = new Array(headers.length).fill("");
    newRow[guildIndex] = guildId;
    newRow[keyIndex] = value;
    data.push(newRow);
  } else {
    data[rowIndex][keyIndex] = value;
  }

  await writeSheet(CONFIG_TAB, [headers, ...data]);
  configCache = null;
}

// --------------------------
// EVENTS
// --------------------------
export async function getEvents(guildId: string) {
  const now = Date.now();
  if (eventsCache && now - lastEventsFetch < CACHE_TTL) {
    return eventsCache[guildId] || [];
  }

  const rows = await readSheet(EVENTS_TAB);
  const headers = rows[0] || [];
  const data = rows.slice(1);
  const map: Record<string, any[]> = {};

  for (const row of data) {
    const obj: any = {};
    headers.forEach((h: string, i: number) => {
      obj[h] = row[i] !== undefined && row[i] !== "" ? String(row[i]).trim() : null;
    });
    if (obj.guildId) {
      if (!map[obj.guildId]) map[obj.guildId] = [];
      // participants / absent stored as JSON
      if (obj.participants) obj.participants = JSON.parse(obj.participants);
      if (obj.absent) obj.absent = JSON.parse(obj.absent);
      map[obj.guildId].push(obj);
    }
  }

  eventsCache = map;
  lastEventsFetch = now;

  return map[guildId] || [];
}

export async function saveEvents(guildId: string, events: any[]) {
  const rows = await readSheet(EVENTS_TAB);
  const headers = rows[0];
  const data = rows.slice(1);

  // usuń stare eventy dla tego guildId
  const newData = data.filter(r => r[headers.indexOf("guildId")] !== guildId);

  for (const event of events) {
    const row = headers.map(h => {
      let val = (event as any)[h];
      if (Array.isArray(val)) val = JSON.stringify(val);
      return val ?? "";
    });
    newData.push(row);
  }

  await writeSheet(EVENTS_TAB, [headers, ...newData]);
  eventsCache = null;
}

// --------------------------
// CHECK CONFIG READY
// --------------------------
export function isConfigured(config: any) {
  return Boolean(config?.notificationChannel && config?.downloadChannel);
}