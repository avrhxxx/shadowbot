import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const CONFIG_TAB = "config";
const EVENTS_TAB = "events";

if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID env variable is missing");
if (!process.env.GOOGLE_SERVICE_ACCOUNT) throw new Error("GOOGLE_SERVICE_ACCOUNT env variable is missing");

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// --------------------------
// CACHE
// --------------------------
let eventsCache: Record<string, any[]> = {};
let configCache: Record<string, any> = {};
let lastEventsFetch = 0;
let lastConfigFetch = 0;
const CACHE_TTL = 30 * 1000;

// --------------------------
// UTILS
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
// EVENTS STORAGE
// --------------------------
export async function getEvents(guildId: string) {
  const now = Date.now();
  if (eventsCache[guildId] && now - lastEventsFetch < CACHE_TTL) return eventsCache[guildId];

  const rows = await readSheet(EVENTS_TAB);
  const headers = rows[0] || [];
  const data = rows.slice(1);

  const events: any[] = data
    .map((row) => {
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined && row[i] !== "" ? row[i] : null;
      });
      if (obj.participants) {
        try { obj.participants = JSON.parse(obj.participants); } catch { obj.participants = []; }
      }
      if (obj.absent) {
        try { obj.absent = JSON.parse(obj.absent); } catch { obj.absent = []; }
      }
      return obj;
    })
    .filter((e) => e.guildId === guildId);

  eventsCache[guildId] = events;
  lastEventsFetch = now;

  return events;
}

export async function saveEvents(guildId: string, events: any[]) {
  const rows = await readSheet(EVENTS_TAB);
  const headers = rows[0] || [
    "id","guildId","name","day","month","hour","minute","year","reminderBefore",
    "status","participants","absent","createdAt","reminderSent","started"
  ];

  // Zachowujemy inne guildId
  const otherRows = rows.slice(1).filter(r => r[1] !== guildId);

  // Zamieniamy eventy na wiersze
  const guildEvents = events.map(e => {
    const copy = { ...e };
    copy.participants = JSON.stringify(copy.participants || []);
    copy.absent = JSON.stringify(copy.absent || []);
    return headers.map(h => copy[h] ?? "");
  });

  await writeSheet(EVENTS_TAB, [headers, ...otherRows, ...guildEvents]);

  eventsCache[guildId] = events;
}

// --------------------------
// CONFIG STORAGE
// --------------------------
export async function getConfig(guildId: string) {
  const now = Date.now();
  if (configCache[guildId] && now - lastConfigFetch < CACHE_TTL) return configCache[guildId];

  const rows = await readSheet(CONFIG_TAB);
  const headers = rows[0] || [];
  const data = rows.slice(1);

  const map: Record<string, any> = {};
  for (const row of data) {
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? null; });
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

  if (keyIndex === -1) throw new Error(`Column ${key} not found: ${key}`);

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

  configCache = {};
}

// --------------------------
// CHECK CONFIG
// --------------------------
export function isConfigured(config: any) {
  return Boolean(config?.notificationChannel && config?.downloadChannel);
}