// =====================================
// 📁 src/integrations/google/googleSheetsSetup.ts
// =====================================

import { sheetsClient } from "@/integrations/google/googleSheetsClient";
import { readSheet, writeSheet } from "@/integrations/google/googleSheetsStorage";
import { ALL_SHEETS, SheetDefinition } from "@/integrations/google/googleSheetsSchema";
import pRetry, { AbortError } from "p-retry";

// =====================================
// 🔐 ENV
// =====================================

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID || !SHEET_ID.trim()) {
  throw new Error("GOOGLE_SHEET_ID env variable is missing");
}

// =====================================
// 🔍 ERROR HELPER
// =====================================

function getStatus(err: unknown): number | undefined {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (err as { response?: unknown }).response;

    if (
      typeof response === "object" &&
      response !== null &&
      "status" in response
    ) {
      const status = (response as { status?: unknown }).status;

      if (typeof status === "number") {
        return status;
      }
    }
  }

  return undefined;
}

// =====================================
// 🔁 RETRY WRAPPER (CONSISTENT)
// =====================================

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  return pRetry(fn, {
    retries: 3,
    onFailedAttempt: (error) => {
      const status = getStatus(error);

      if (status && status >= 400 && status < 500 && status !== 429) {
        throw new AbortError("Non-retryable error");
      }
    },
  });
}

// =====================================
// 🔍 GET ALL SHEETS (ONCE)
// =====================================

async function getExistingSheetTitles(): Promise<Set<string>> {
  const res = await withRetry(() =>
    sheetsClient.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    })
  );

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
    await withRetry(() =>
      sheetsClient.spreadsheets.batchUpdate({
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
      })
    );

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

  const currentHeaders = rows[0];

  if (!Array.isArray(currentHeaders)) {
    throw new Error(`Invalid header row in sheet "${def.name}"`);
  }

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