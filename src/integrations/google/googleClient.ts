// =====================================
// 📁 src/integrations/google/googleClient.ts
// =====================================

import { google } from "googleapis";
import { TranslationServiceClient } from "@google-cloud/translate";

// =====================================
// 🔹 TYPES
// =====================================

type GoogleServiceAccount = Readonly<{
  client_email: string;
  private_key: string;
  [key: string]: unknown;
}>;

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

let parsed: GoogleServiceAccount;

try {
  parsed = JSON.parse(rawEnv) as GoogleServiceAccount;
} catch {
  throw new Error("GOOGLE_SERVICE_ACCOUNT has invalid JSON format");
}

// =====================================
// 🔍 VALIDATION
// =====================================

if (
  typeof parsed.client_email !== "string" ||
  typeof parsed.private_key !== "string"
) {
  throw new Error("GOOGLE_SERVICE_ACCOUNT is missing required fields");
}

// =====================================
// 🔒 IMMUTABLE NORMALIZED CREDENTIALS
// =====================================

const googleCredentials: GoogleServiceAccount = Object.freeze({
  ...parsed,
  private_key: parsed.private_key.replace(/\\n/g, "\n"),
});

// =====================================
// 🔥 SHARED AUTH (Sheets, Vision, Translate)
// =====================================

const googleAuth = new google.auth.GoogleAuth({
  credentials: googleCredentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/cloud-vision",
    "https://www.googleapis.com/auth/cloud-translation",
  ] as const,
});

// =====================================
// 📊 SHEETS CLIENT
// =====================================

const sheetsClient = google.sheets({
  version: "v4",
  auth: googleAuth,
});

// =====================================
// 🌐 TRANSLATE CLIENT
// =====================================

const translateClient = new TranslationServiceClient({
  auth: googleAuth,
});

// =====================================
// 🔄 EXPORTS
// =====================================

export { googleAuth, sheetsClient, translateClient, googleCredentials };