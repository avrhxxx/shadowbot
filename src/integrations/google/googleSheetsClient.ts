// =====================================
// 📁 src/integrations/google/googleSheetsClient.ts
// =====================================

import { google } from "googleapis";

// =====================================
// 🔹 TYPES
// =====================================

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  [key: string]: unknown;
};

// =====================================
// 🔐 ENV VALIDATION
// =====================================

const rawEnv = process.env.GOOGLE_SERVICE_ACCOUNT;

if (!rawEnv || !rawEnv.trim()) {
  throw new Error("Missing GOOGLE_SERVICE_ACCOUNT environment variable");
}

// =====================================
// 🔑 PARSE CREDENTIALS (SAFE)
// =====================================

let credentials: GoogleServiceAccount;

try {
  credentials = JSON.parse(rawEnv) as GoogleServiceAccount;
} catch {
  throw new Error("GOOGLE_SERVICE_ACCOUNT has invalid JSON format");
}

// =====================================
// 🔍 VALIDATION
// =====================================

if (
  typeof credentials.client_email !== "string" ||
  typeof credentials.private_key !== "string"
) {
  throw new Error("GOOGLE_SERVICE_ACCOUNT is missing required fields");
}

// Fix multiline private key (CRITICAL for GCP / Railway)
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

// =====================================
// 🔥 SHARED AUTH (Sheets + Vision)
// =====================================

const googleAuth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/cloud-vision",
  ],
});

// =====================================
// 📊 SHEETS CLIENT
// =====================================

const sheetsClient = google.sheets({
  version: "v4",
  auth: googleAuth,
});

// =====================================
// 🔄 EXPORTS
// =====================================

export { googleAuth, sheetsClient, credentials as googleCredentials };