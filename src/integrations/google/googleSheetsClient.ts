// =====================================
// 📁 src/google/googleSheetsClient.ts
// =====================================

/**
 * 🧠 ROLE:
 * Shared Google Cloud authentication + Sheets client.
 *
 * Responsibilities:
 * - provide single GoogleAuth instance
 * - configure scopes for all Google services (Sheets + Vision)
 *
 * ❗ RULES:
 * - single source of truth for auth
 * - reusable across Google integrations
 */

import { google } from "googleapis";

// =====================================
// 🔐 ENV CHECK
// =====================================

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje zmiennej GOOGLE_SERVICE_ACCOUNT!");
}

// =====================================
// 🔑 PARSE CREDENTIALS
// =====================================

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// =====================================
// 🔥 SHARED AUTH (Sheets + Vision)
// =====================================

export const googleAuth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/cloud-platform", // 🔥 wymagane dla Vision
  ],
});

// =====================================
// 📊 SHEETS CLIENT
// =====================================

export const sheetsClient = google.sheets({
  version: "v4",
  auth: googleAuth,
});
