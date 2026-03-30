// =====================================
// 📁 src/integrations/google/googleSheetsStorage.ts
// =====================================

import { sheetsClient } from "@/integrations/google/googleSheetsClient";
import pRetry from "p-retry";

// =====================================
// 🔐 ENV
// =====================================

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID || !SHEET_ID.trim()) {
  throw new Error("GOOGLE_SHEET_ID env variable is missing");
}

// =====================================
// 🔁 RETRY WRAPPER
// =====================================

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  return pRetry(fn, {
    retries: 3,
  });
}

// =====================================
// 📥 READ
// =====================================

export async function readSheet(tab: string): Promise<readonly unknown[][]> {
  try {
    const res = await withRetry(() =>
      sheetsClient.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: tab,
      })
    );

    return res.data?.values ?? [];
  } catch (err) {
    throw new Error(
      `Failed to read sheet "${tab}": ${(err as Error).message}`
    );
  }
}

// =====================================
// 📤 WRITE (FULL REPLACE)
// =====================================

export async function writeSheet(
  tab: string,
  values: readonly unknown[][]
): Promise<void> {
  try {
    await withRetry(() =>
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: tab,
        valueInputOption: "RAW",
        requestBody: { values },
      })
    );
  } catch (err) {
    throw new Error(
      `Failed to write sheet "${tab}": ${(err as Error).message}`
    );
  }
}

// =====================================
// ➕ APPEND
// =====================================

export async function appendSheet(
  tab: string,
  values: readonly unknown[][]
): Promise<void> {
  if (!values.length) return;

  try {
    await withRetry(() =>
      sheetsClient.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: tab,
        valueInputOption: "RAW",
        requestBody: { values },
      })
    );
  } catch (err) {
    throw new Error(
      `Failed to append sheet "${tab}": ${(err as Error).message}`
    );
  }
}

// =====================================
// 🔄 UPDATE SINGLE CELL
// =====================================

export async function updateCell(
  tab: string,
  row: number,
  col: number,
  value: unknown
): Promise<void> {
  if (row <= 0 || col <= 0) {
    throw new Error("Invalid row/col index");
  }

  const range = `${tab}!${toA1(col, row)}`;

  try {
    await withRetry(() =>
      sheetsClient.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [[value]] },
      })
    );
  } catch (err) {
    throw new Error(
      `Failed to update cell in "${tab}": ${(err as Error).message}`
    );
  }
}

// =====================================
// ❌ DELETE ROW
// =====================================

export async function deleteRow(
  tab: string,
  row: number
): Promise<void> {
  if (row <= 0) {
    throw new Error("Invalid row index");
  }

  try {
    const sheetId = await getSheetId(tab);

    await withRetry(() =>
      sheetsClient.spreadsheets.batchUpdate({
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
      })
    );
  } catch (err) {
    throw new Error(
      `Failed to delete row in "${tab}": ${(err as Error).message}`
    );
  }
}

// =====================================
// 🔍 GET SHEET ID (INTERNAL)
// =====================================

async function getSheetId(tab: string): Promise<number> {
  const res = await withRetry(() =>
    sheetsClient.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    })
  );

  const sheets = res.data?.sheets ?? [];

  const sheet = sheets.find(
    (s) => s.properties?.title === tab
  );

  const id = sheet?.properties?.sheetId;

  if (typeof id !== "number") {
    throw new Error(`Sheet "${tab}" not found`);
  }

  return id;
}

// =====================================
// 🔧 HELPERS
// =====================================

function toA1(col: number, row: number): string {
  let result = "";

  while (col > 0) {
    const rem = (col - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    col = Math.floor((col - 1) / 26);
  }

  return result + row;
}