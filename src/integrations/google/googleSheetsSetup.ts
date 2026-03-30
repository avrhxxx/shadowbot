// =====================================
// 📁 src/integrations/google/googleSheetsSetup.ts
// =====================================

import { sheetsClient } from "@/integrations/google/googleSheetsClient";
import { readSheet, writeSheet } from "@/integrations/google/googleSheetsStorage";
import { ALL_SHEETS, SheetDefinition } from "@/integrations/google/googleSheetsSchema";

// =====================================
// 🔐 ENV
// =====================================

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID || !SHEET_ID.trim()) {
  throw new Error("GOOGLE_SHEET_ID env variable is missing");
}

// =====================================
// 🔍 GET ALL SHEETS (ONCE)
// =====================================

async function getExistingSheetTitles(): Promise<Set<string>> {
  const res = await sheetsClient.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const sheets = res.data?.sheets ?? [];

  return new Set(
    sheets
      .map((s) => s.properties?.title)
      .filter((t): t is string => typeof t === "string")
  );
}

// =====================================
// 🧠 ENSURE SINGLE SHEET
// =====================================

async function ensureSheet(
  def: SheetDefinition,
  existing: Set<string>
) {
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

    // add to cache (IMPORTANT)
    existing.add(def.name);
  }

  // ----------------------------
  // 🧱 ENSURE HEADERS
  // ----------------------------
  const rows = await readSheet(def.name);

  if (!rows.length) {
    await writeSheet(def.name, [def.headers]);
    return;
  }

  const currentHeaders = (rows[0] ?? []) as string[];

  const isSame =
    currentHeaders.length === def.headers.length &&
    currentHeaders.every((h, i) => h === def.headers[i]);

  // ❗ STRICT MODE (NO AUTO MIGRATION)
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
  const existing = await getExistingSheetTitles();

  for (const sheet of ALL_SHEETS) {
    await ensureSheet(sheet, existing);
  }
}