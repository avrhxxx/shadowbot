// =====================================
// 📁 src/integrations/google/googleSheets.ts
// =====================================

import { sheetsClient } from "./googleClient.js";
import pRetry from "p-retry";
import { AbortError } from "p-retry";

// =====================================
// 🔐 ENV
// =====================================

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID || !SHEET_ID.trim()) {
  throw new Error("GOOGLE_SHEET_ID env variable is missing");
}

// =====================================
// 🔁 RETRY
// =====================================

function getStatus(err: unknown): number | undefined {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (err as { response?: { status?: number } }).response;
    return response?.status;
  }

  return undefined;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  return pRetry(fn, {
    retries: 3,
    onFailedAttempt: (error: unknown) => {
      const status = getStatus(error);

      if (status && status >= 400 && status < 500 && status !== 429) {
        throw new AbortError("Non-retryable error");
      }
    },
  } as any); // ✅ FIX pod TS
}

// =====================================
// 🔧 INTERNAL
// =====================================

function toMutable(values: readonly unknown[][]): unknown[][] {
  return values.map((r) => [...r]);
}

// =====================================
// 📥 READ
// =====================================

export async function read(range: string): Promise<unknown[][]> {
  const res = await withRetry(() =>
    sheetsClient.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    })
  );

  const data = res as {
    data?: { values?: unknown[][] };
  };

  return data.data?.values ?? [];
}

// =====================================
// 📤 WRITE (FULL REPLACE)
// =====================================

export async function write(
  range: string,
  values: readonly unknown[][]
): Promise<void> {
  await withRetry(() =>
    sheetsClient.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: toMutable(values),
      },
    })
  );
}

// =====================================
// ➕ APPEND
// =====================================

export async function append(
  range: string,
  values: readonly unknown[][]
): Promise<void> {
  if (!values.length) return;

  await withRetry(() =>
    sheetsClient.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: toMutable(values),
      },
    })
  );
}

// =====================================
// 🔄 UPDATE
// =====================================

export async function update(
  range: string,
  values: readonly unknown[][]
): Promise<void> {
  await write(range, values);
}

// =====================================
// ❌ CLEAR
// =====================================

export async function clear(range: string): Promise<void> {
  await withRetry(() =>
    sheetsClient.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range,
    })
  );
}

// =====================================
// 🔥 BATCH (KLUCZOWE)
// =====================================

export type BatchOperation =
  | { type: "update"; range: string; values: readonly unknown[][] }
  | { type: "append"; range: string; values: readonly unknown[][] }
  | { type: "clear"; range: string };

export async function batch(
  operations: BatchOperation[]
): Promise<void> {
  if (!operations.length) return;

  await Promise.all(
    operations.map((op) => {
      if (op.type === "update") {
        return update(op.range, op.values);
      }

      if (op.type === "append") {
        return append(op.range, op.values);
      }

      if (op.type === "clear") {
        return clear(op.range);
      }
    })
  );
}