// src/googleSheetsStorage.ts
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const EVENTS_TAB = "events";
const EVENTS_CONFIG_TAB = "events_config";

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
// UPDATE / DELETE CELLS
// --------------------------

// Aktualizacja pojedynczej komórki w zakładce config
export async function updateConfigCell(row: number, col: number, value: any) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${EVENTS_CONFIG_TAB}!${col}${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

// Aktualizacja pojedynczej komórki w zakładce events
export async function updateEventCell(row: number, col: number, value: any) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${EVENTS_TAB}!${col}${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

// Usunięcie całego wiersza w zakładce events
export async function deleteEventRow(row: number) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // jeśli masz tylko jedną zakładkę events, SheetId=0. W innym wypadku trzeba pobrać sheetId przez API.
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