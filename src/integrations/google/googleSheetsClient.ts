// =====================================
// 📁 src/google/googleSheetsClient.ts
// =====================================

import { google } from "googleapis";

// =====================================
// 🔐 ENV CHECK
// =====================================

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("❌ Brakuje zmiennej GOOGLE_SERVICE_ACCOUNT!");
}

// =====================================
// 🔑 PARSE CREDENTIALS (SAFE)
// =====================================

let credentials: any;

try {
  credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT as string);
} catch (error) {
  throw new Error("❌ GOOGLE_SERVICE_ACCOUNT ma niepoprawny JSON format");
}

// =====================================
// 🔍 VALIDATION
// =====================================

if (!credentials.client_email || !credentials.private_key) {
  throw new Error("❌ GOOGLE_SERVICE_ACCOUNT brakuje wymaganych pól");
}

// Fix multiline private key
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

// =====================================
// 🔥 SHARED AUTH (Sheets + Vision)
// =====================================

export const googleAuth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/cloud-vision",
  ],
});

// =====================================
// 📊 SHEETS CLIENT
// =====================================

export const sheetsClient = google.sheets({
  version: "v4",
  auth: googleAuth,
});