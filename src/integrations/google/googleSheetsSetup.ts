// =====================================
// 📁 src/integrations/google/googleSheetsSetup.ts
// =====================================

import { sheetsClient } from "./googleSheetsClient";
import { readSheet, writeSheet } from "./googleSheetsStorage";
import { ALL_SHEETS, SheetDefinition } from "./googleSheetsSchema";

// =====================================
// 🔐 ENV
// =====================================

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID || !SHEET_ID.trim()) {
  throw new Error("GOOGLE_SHEET_ID env variable is missing");
}

// =====================================
// 🔍 GET ALL SHEETS
// =====================================

async function getExistingSheetTitles(): Promise<Set<string>> {
  const res = await sheetsClient.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const sheets = res.data?.sheets ?? [];

  return new Set(
    sheets.map((s) => s.properties?.title).filter(Boolean)
  );
}

// =====================================
// 🧠 ENSURE SINGLE SHEET
// =====================================

async function ensureSheet(def: SheetDefinition) {
  const existing = await getExistingSheetTitles();

  // ----------------------------
  // 🆕 CREATE TAB IF MISSING
  // ----------------------------
  if (!existing.has(def.name)) {
    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: def.name },
            },
          },
        ],
      },
    });
  }

  // ----------------------------
  // 🧱 ENSURE HEADERS
  // ----------------------------
  const rows = await readSheet(def.name);

  if (!rows.length) {
    await writeSheet(def.name, [def.headers]);
    return;
  }

  const currentHeaders = rows[0] ?? [];

  const isSame =
    currentHeaders.length === def.headers.length &&
    currentHeaders.every((h, i) => h === def.headers[i]);

  // ❗ STRICT MODE:
  // do NOT auto-migrate silently
  if (!isSame) {
    throw new Error(
      `❌ Sheet "${def.name}" has invalid headers.\nExpected: ${def.headers.join(
        ", "
      )}\nGot: ${currentHeaders.join(", ")}`
    );
  }
}

// =====================================
// 🚀 INIT ALL
// =====================================

export async function ensureAllSheets() {
  for (const sheet of ALL_SHEETS) {
    await ensureSheet(sheet);
  }
}