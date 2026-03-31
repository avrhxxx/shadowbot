// =====================================
// 📁 src/integrations/google/googleSetup.ts
// =====================================

/**
 * 🧠 ROLE:
 * Ensures Google Sheets structure is valid (self-healing)
 *
 * Responsibilities:
 * - create missing sheets
 * - ensure headers exist and are correct
 *
 * ❗ RULES:
 * - NO business logic
 * - uses schema as source of truth
 * - runs once at startup
 */

import { sheetsClient } from "./googleSheetsClient.js";
import { ALL_SHEETS } from "./googleSchema.js";

// =====================================
// 🔐 ENV
// =====================================

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID || !SHEET_ID.trim()) {
  throw new Error("GOOGLE_SHEET_ID env variable is missing");
}

// =====================================
// 🔍 GET EXISTING SHEETS
// =====================================

async function getExistingSheets(): Promise<
  Map<string, number>
> {
  const res = await sheetsClient.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const map = new Map<string, number>();

  for (const sheet of res.data.sheets ?? []) {
    const title = sheet.properties?.title;
    const id = sheet.properties?.sheetId;

    if (title && typeof id === "number") {
      map.set(title, id);
    }
  }

  return map;
}

// =====================================
// ➕ CREATE SHEET
// =====================================

async function createSheet(title: string): Promise<void> {
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: { title },
          },
        },
      ],
    },
  });
}

// =====================================
// 🔧 SET HEADERS
// =====================================

async function setHeaders(
  title: string,
  headers: readonly string[]
): Promise<void> {
  await sheetsClient.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${title}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [headers],
    },
  });
}

// =====================================
// 🔍 CHECK HEADERS
// =====================================

async function getHeaders(
  title: string
): Promise<string[]> {
  const res = await sheetsClient.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${title}!A1:Z1`,
  });

  return (res.data.values?.[0] ?? []) as string[];
}

// =====================================
// 🧠 ENSURE ONE SHEET
// =====================================

async function ensureSheet(
  name: string,
  headers: readonly string[],
  existing: Map<string, number>
): Promise<void> {
  // =============================
  // CREATE IF MISSING
  // =============================

  if (!existing.has(name)) {
    await createSheet(name);
    await setHeaders(name, headers);
    return;
  }

  // =============================
  // CHECK HEADERS
  // =============================

  const current = await getHeaders(name);

  const isValid =
    current.length === headers.length &&
    current.every((h, i) => h === headers[i]);

  if (!isValid) {
    await setHeaders(name, headers);
  }
}

// =====================================
// 🚀 PUBLIC API
// =====================================

export async function ensureAllSheets(): Promise<void> {
  const existing = await getExistingSheets();

  for (const sheet of ALL_SHEETS) {
    await ensureSheet(sheet.name, sheet.headers, existing);
  }
}