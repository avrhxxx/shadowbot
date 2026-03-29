// =====================================
// 📁 src/integrations/google/googleSheetsStorage.ts
// =====================================

import { sheetsClient } from "./googleSheetsClient";

// =====================================
// 🔐 ENV
// =====================================

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID || !SHEET_ID.trim()) {
  throw new Error("GOOGLE_SHEET_ID env variable is missing");
}

// --------------------------
// TABS
// --------------------------
const QUICKADD_NICKNAMES_TAB = "quickadd_nicknames";
const QUICKADD_EVENTS_QUEUE_TAB = "quickadd_events_queue";
const QUICKADD_POINTS_QUEUE_TAB = "quickadd_points_queue";

// --------------------------
// BASIC READ / WRITE
// --------------------------
async function readSheet(tab: string): Promise<unknown[][]> {
  const res = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tab,
  });

  return res.data?.values ?? [];
}

async function writeSheet(tab: string, values: unknown[][]): Promise<void> {
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

  return res.data?.sheets ?? [];
}

async function ensureSheetExists(tab: string, headers: unknown[][]) {
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
              properties: { title: tab },
            },
          },
        ],
      },
    });
  }

  // ENSURE HEADERS
  const rows = await readSheet(tab);

  if (!rows.length || !(rows[0]?.length > 0)) {
    await writeSheet(`${tab}!A1`, headers);
  }
}

// 🔥 INIT
export async function ensureAllSheets() {
  await ensureSheetExists(QUICKADD_EVENTS_QUEUE_TAB, [[]]);
  await ensureSheetExists(QUICKADD_POINTS_QUEUE_TAB, [[]]);
  await ensureSheetExists(QUICKADD_NICKNAMES_TAB, [[]]);
}

// --------------------------
// HELPERS
// --------------------------
async function getSheetId(tab: string): Promise<number> {
  const res = await sheetsClient.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const sheet = res.data?.sheets?.find(
    (s) => s.properties?.title === tab
  );

  const id = sheet?.properties?.sheetId;

  if (typeof id !== "number") {
    throw new Error(`Sheet "${tab}" not found`);
  }

  return id;
}

async function updateCell(
  tab: string,
  row: number,
  col: number,
  value: unknown
): Promise<void> {
  if (row <= 0 || col <= 0) {
    throw new Error("Invalid row/col index");
  }

  const range = `${tab}!${toA1(col, row)}`;

  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

async function deleteRow(tab: string, row: number): Promise<void> {
  if (row <= 0) {
    throw new Error("Invalid row index");
  }

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
export async function appendLearningRows(values: unknown[][]) {
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