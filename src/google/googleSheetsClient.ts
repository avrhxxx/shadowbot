// src/google/googleSheetsClient.ts
import { google } from "googleapis";

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje zmiennej GOOGLE_SERVICE_ACCOUNT!");
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// 🔥 WSPÓLNY AUTH (Sheets + Vision + wszystko z Google Cloud)
export const googleAuth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/cloud-platform", // 🔥 DODAJ TO
  ],
});

// 🔥 Sheets client
export const sheetsClient = google.sheets({
  version: "v4",
  auth: googleAuth,
});