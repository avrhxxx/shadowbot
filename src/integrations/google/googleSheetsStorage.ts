// =====================================
// 📁 src/integrations/google/googleSheetsStorage.ts
// =====================================

import { sheetsClient } from "./googleSheetsClient";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// --------------------------
// TABS
// --------------------------
const MODERATOR_CONFIG_TAB = "moderator_config";

const EVENTS_TAB = "events";
const EVENTS_CONFIG_TAB = "events_config";

const POINTS_WEEKS_TAB = "points_weeks";
const POINTS_DONATIONS_TAB = "points_donations";
const POINTS_DUEL_TAB = "points_duel";
const POINTS_CONFIG_TAB = "points_config";

const ABSENCE_TAB = "absence";
const ABSENCE_CONFIG_TAB = "absence_config";

const TRANSLATE_TAB = "translate";
const TRANSLATE_CONFIG_TAB = "translate_config";

// 🔥 QUICKADD (UPDATED)
const QUICKADD_NICKNAMES_TAB = "quickadd_nicknames";

// 🔥 QUEUES
const QUICKADD_EVENTS_QUEUE_TAB = "quickadd_events_queue";
const QUICKADD_POINTS_QUEUE_TAB = "quickadd_points_queue";

// --------------------------
// ENV VALIDATION
// --------------------------
if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID env variable is missing");

// --------------------------
// BASIC READ / WRITE
// --------------------------
async function readSheet(tab: string): Promise<any[][]> {
  const res = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tab,
  });
  return res.data.values || [];
}

async function writeSheet(tab: string, values: any[][]) {
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// --------------------------
// 🔥 SELF HEALING
// --------------------------
async function getAllSheets() {
  const res = await sheetsClient.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  return res.data.sheets || [];
}

async function ensureSheetExists(tab: string, headers: any[][]) {
  const allSheets = await getAllSheets();
  const exists = allSheets.some((s) => s.properties?.title === tab);

  // CREATE TAB
  if (!exists) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: tab,
              },
            },
          },
        ],
      },
    });
  }

  // ENSURE HEADERS
  const rows = await readSheet(tab);

  if (!rows || rows.length === 0 || rows[0].length === 0) {
    await writeSheet(`${tab}!A1`, headers);
  }
}

// 🔥 INIT
export async function ensureAllSheets() {
  // 🔥 QUICKADD — NO SCHEMA (only create tabs)
  await ensureSheetExists(QUICKADD_EVENTS_QUEUE_TAB, [[]]);

  await ensureSheetExists(QUICKADD_POINTS_QUEUE_TAB, [[]]);

  await ensureSheetExists(QUICKADD_NICKNAMES_TAB, [[]]);
}

// --------------------------
// HELPERS
// --------------------------
async function getSheetId(tab: string): Promise<number> {
  const res = await sheetsClient.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = res.data.sheets?.find((s) => s.properties?.title === tab);
  if (!sheet?.properties?.sheetId)
    throw new Error(`Sheet "${tab}" not found`);
  return sheet.properties.sheetId;
}

async function updateCell(tab: string, row: number, col: number, value: any) {
  const range = `${tab}!${toA1(col, row)}`;
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

async function deleteRow(tab: string, row: number) {
  const sheetId = await getSheetId(tab);
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: row - 1,
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}

// --------------------------
// 🔥 APPEND (LEARNING)
// --------------------------
export async function appendLearningRows(values: any[][]) {
  if (!values.length) return;

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: QUICKADD_NICKNAMES_TAB,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });
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
// EXPORT
// --------------------------
export { readSheet, writeSheet, updateCell, deleteRow };