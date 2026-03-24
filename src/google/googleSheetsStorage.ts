// =====================================
// 📁 src/google/googleSheetsStorage.ts
// =====================================

import { google } from "googleapis";

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
if (!process.env.GOOGLE_SERVICE_ACCOUNT)
  throw new Error("GOOGLE_SERVICE_ACCOUNT env variable is missing");

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
// 🔥 SELF HEALING
// --------------------------
async function getAllSheets() {
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  return res.data.sheets || [];
}

async function ensureSheetExists(tab: string, headers: any[][]) {
  const allSheets = await getAllSheets();
  const exists = allSheets.some((s) => s.properties?.title === tab);

  // CREATE TAB
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
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
  await ensureSheetExists(QUICKADD_EVENTS_QUEUE_TAB, [
    ["guildId", "eventId", "type", "nickname", "createdAt"],
  ]);

  await ensureSheetExists(QUICKADD_POINTS_QUEUE_TAB, [
    ["guildId", "category", "week", "nickname", "points", "createdAt"],
  ]);

  // 🔥 NEW LEARNING SHEET
  await ensureSheetExists(QUICKADD_NICKNAMES_TAB, [
    [
      "type",
      "ocr_raw",
      "layout_text",
      "parser_output",
      "adjusted",
      "override",
      "created_at",
    ],
  ]);
}

// --------------------------
// HELPERS
// --------------------------
async function getSheetId(tab: string): Promise<number> {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = res.data.sheets?.find((s) => s.properties?.title === tab);
  if (!sheet?.properties?.sheetId)
    throw new Error(`Sheet "${tab}" not found`);
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

  await sheets.spreadsheets.values.append({
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