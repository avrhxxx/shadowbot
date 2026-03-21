// src/google/googleSheetsClient.ts
import { google } from "googleapis";

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje zmiennej GOOGLE_SERVICE_ACCOUNT!");
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// 🔥 wspólny auth (możesz użyć też w innych API)
export const googleAuth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// 🔥 klient Sheets
export const sheetsClient = google.sheets({
  version: "v4",
  auth: googleAuth,
});