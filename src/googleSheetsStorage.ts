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