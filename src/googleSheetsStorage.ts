// src/googleSheetsStorage.ts
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// --------------------------
// MODERATOR CONFIG TABS
// --------------------------
const MODERATOR_CONFIG_TAB = "moderator_config";

// --------------------------
// EVENTS TABS
// --------------------------
const EVENTS_TAB = "events";
const EVENTS_CONFIG_TAB = "events_config";

// --------------------------
// POINTS TABS
// --------------------------
const POINTS_WEEKS_TAB = "points_weeks";
const POINTS_DONATIONS_TAB = "points_donations";
const POINTS_DUEL_TAB = "points_duel";
const POINTS_CONFIG_TAB = "points_config";

// --------------------------
// ABSENCE TABS
// --------------------------
const ABSENCE_TAB = "absence";
const ABSENCE_CONFIG_TAB = "absence_config";

// --------------------------
// TRANSLATE TABS
// --------------------------
const TRANSLATE_TAB = "translate";
const TRANSLATE_CONFIG_TAB = "translate_config";

// --------------------------
// ENV VALIDATION
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
// BASIC READ / WRITE
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
// GENERIC HELPERS
// --------------------------
async function getSheetId(tab: string): Promise<number> {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = res.data.sheets?.find(s => s.properties?.title === tab);
  if (!sheet?.properties?.sheetId) throw new Error(`Sheet "${tab}" not found`);
  return sheet.properties.sheetId;
}

async function updateCell(tab: string, row: number, col: number, value: any) {
  const range = `${tab}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

async function deleteRow(tab: string, row: number) {
  const sheetId = await getSheetId(tab);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: row - 1, endIndex: row },
          },
        },
      ],
    },
  });
}

// --------------------------
// POINTS STORAGE (HELPERS)
// --------------------------
export async function ensurePointsHeaders() {
  const tabs = [
    { tab: POINTS_WEEKS_TAB, headers: [["Category", "Week", "Nick", "Points"]] },
    { tab: POINTS_DONATIONS_TAB, headers: [["Category", "Week", "Nick", "Points"]] },
    { tab: POINTS_DUEL_TAB, headers: [["Category", "Week", "Nick", "Points"]] },
    { tab: POINTS_CONFIG_TAB, headers: [["ConfigKey", "ConfigValue"]] },
  ];

  for (const { tab, headers } of tabs) {
    const rows = await readSheet(tab);
    if (!rows || rows.length === 0 || rows[0].length === 0) {
      await writeSheet(`${tab}!A1:D1`, headers);
    }
  }
}

export async function readPointsWeeksSheet(): Promise<any[][]> {
  return readSheet(POINTS_WEEKS_TAB);
}

export async function readPointsDonationsSheet(): Promise<any[][]> {
  return readSheet(POINTS_DONATIONS_TAB);
}

export async function readPointsDuelSheet(): Promise<any[][]> {
  return readSheet(POINTS_DUEL_TAB);
}

export async function readPointsConfigSheet(): Promise<any[][]> {
  return readSheet(POINTS_CONFIG_TAB);
}

export async function writePointsDonationsSheet(values: any[][]) {
  return writeSheet(POINTS_DONATIONS_TAB, values);
}

export async function writePointsDuelSheet(values: any[][]) {
  return writeSheet(POINTS_DUEL_TAB, values);
}

export async function updatePointsDonationsCell(row: number, col: number, value: any) {
  return updateCell(POINTS_DONATIONS_TAB, row, col, value);
}

export async function updatePointsDuelCell(row: number, col: number, value: any) {
  return updateCell(POINTS_DUEL_TAB, row, col, value);
}

export async function deletePointsDonationsRow(row: number) {
  return deleteRow(POINTS_DONATIONS_TAB, row);
}

export async function deletePointsDuelRow(row: number) {
  return deleteRow(POINTS_DUEL_TAB, row);
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
// EKSPORT DLA TS / POINTS SERVICE
// --------------------------
export { readSheet, writeSheet, updateCell };