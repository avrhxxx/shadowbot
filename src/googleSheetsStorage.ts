// src/googleSheetsStorage.ts
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// --------------------------
// TABS
// --------------------------
const MODERATOR_CONFIG_TAB = "moderator_config";
const EVENTS_TAB = "events";
const EVENTS_CONFIG_TAB = "events_config";
const ABSENCE_TAB = "absence";
const ABSENCE_CONFIG_TAB = "absence_config";

// --------------------------
// VALIDACJA ENV
// --------------------------
if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID env variable is missing");
if (!process.env.GOOGLE_SERVICE_ACCOUNT) throw new Error("GOOGLE_SERVICE_ACCOUNT env variable is missing");

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// --------------------------
// UTILS
// --------------------------
async function readSheet(tab: string): Promise<any[][]> {
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
export async function readEventsSheet(): Promise<any[][]> {
  return await readSheet(EVENTS_TAB);
}

export async function writeEventsSheet(values: any[][]) {
  await writeSheet(EVENTS_TAB, values);
}

// --------------------------
// CONFIG STORAGE
// --------------------------
export async function readConfigSheet(): Promise<any[][]> {
  return await readSheet(EVENTS_CONFIG_TAB);
}

export async function writeConfigSheet(values: any[][]) {
  await writeSheet(EVENTS_CONFIG_TAB, values);
}

// --------------------------
// MODERATOR CONFIG STORAGE
// --------------------------
export async function readModeratorConfig(): Promise<any[][]> {
  return await readSheet(MODERATOR_CONFIG_TAB);
}

export async function writeModeratorConfig(values: any[][]) {
  await writeSheet(MODERATOR_CONFIG_TAB, values);
}

// --------------------------
// HELPERS
// --------------------------
function toA1(col: number, row: number): string {
  let result = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    col = Math.floor((col - 1) / 26);
  }
  return result + row;
}

// --------------------------
// UPDATE / DELETE CELLS
// --------------------------
export async function updateConfigCell(row: number, col: number, value: any) {
  const range = `${EVENTS_CONFIG_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function updateEventCell(row: number, col: number, value: any) {
  const range = `${EVENTS_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function deleteEventRow(row: number) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // jeśli masz tylko jedną zakładkę events, SheetId=0
              dimension: "ROWS",
              startIndex: row - 1, // 0-indexed
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}

// --------------------------
// MODERATOR PANEL HELPERS
// --------------------------

// Aktualizacja pojedynczej komórki w moderator_config
export async function updateModeratorConfigCell(row: number, col: number, value: any) {
  const range = `${MODERATOR_CONFIG_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

// Zapis informacji panelu: channelId, messageId, version, unix timestamp
export async function saveModeratorPanelInfo(channelId: string, messageId: string, version: string) {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  const values = [[channelId, messageId, version, unixTimestamp]];
  await writeModeratorConfig(values);
}

// Odczyt danych panelu
export async function getModeratorPanelInfo(): Promise<{
  channelId: string;
  messageId: string;
  version: string;
  lastUpdated: number;
} | null> {
  const rows = await readModeratorConfig();
  if (!rows || rows.length === 0) return null;

  const [channelId, messageId, version, lastUpdated] = rows[0];
  return {
    channelId,
    messageId,
    version,
    lastUpdated: Number(lastUpdated)
  };
}

// Aktualizacja pojedynczej kolumny panelu
export async function updateModeratorPanelColumn(col: "channelId" | "messageId" | "version" | "lastUpdated", value: string | number) {
  const colMap: Record<typeof col, number> = {
    channelId: 1,
    messageId: 2,
    version: 3,
    lastUpdated: 4
  };

  await updateModeratorConfigCell(1, colMap[col], value);
}