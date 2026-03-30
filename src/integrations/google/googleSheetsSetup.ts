// =====================================
// 📁 src/integrations/google/googleSheetsSetup.ts
// =====================================

import { sheetsClient } from "./googleSheetsClient";
import { writeSheet, readSheet } from "./googleSheetsStorage";
import { SHEETS, SheetName } from "./googleSheetsSchema";

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

async function getAllSheets() {
  const res = await sheetsClient.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  return res.data?.sheets ?? [];
}

// =====================================
// 🧠 ENSURE SINGLE SHEET
// =====================================

async function ensureSheetExists(
  tab: SheetName,
  headers: unknown[][]
) {
  const allSheets = await getAllSheets();

  const exists = allSheets.some(
    (s) => s.properties?.title === tab
  );

  // --------------------------
  // CREATE TAB
  // --------------------------
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

  // --------------------------
  // ENSURE HEADERS
  // --------------------------
  const rows = await readSheet(tab);

  if (!rows.length || !(rows[0]?.length > 0)) {
    await writeSheet(`${tab}!A1`, headers);
  }
}

// =====================================
// 🚀 INIT ALL SHEETS
// =====================================

export async function ensureAllSheets() {
  // 🔥 QUICKADD (no schema yet)
  await ensureSheetExists(SHEETS.QUICKADD_EVENTS_QUEUE_TAB, [[]]);
  await ensureSheetExists(SHEETS.QUICKADD_POINTS_QUEUE_TAB, [[]]);
  await ensureSheetExists(SHEETS.QUICKADD_NICKNAMES_TAB, [[]]);

  // 🔥 CORE SYSTEMS (future-ready)
  await ensureSheetExists(SHEETS.EVENTS_TAB, [[]]);
  await ensureSheetExists(SHEETS.POINTS_WEEKS_TAB, [[]]);
  await ensureSheetExists(SHEETS.POINTS_DONATIONS_TAB, [[]]);
  await ensureSheetExists(SHEETS.POINTS_DUEL_TAB, [[]]);
  await ensureSheetExists(SHEETS.ABSENCE_TAB, [[]]);
  await ensureSheetExists(SHEETS.TRANSLATE_TAB, [[]]);

  // 🔥 CONFIGS
  await ensureSheetExists(SHEETS.EVENTS_CONFIG_TAB, [[]]);
  await ensureSheetExists(SHEETS.POINTS_CONFIG_TAB, [[]]);
  await ensureSheetExists(SHEETS.ABSENCE_CONFIG_TAB, [[]]);
  await ensureSheetExists(SHEETS.TRANSLATE_CONFIG_TAB, [[]]);
  await ensureSheetExists(SHEETS.MODERATOR_CONFIG_TAB, [[]]);
}