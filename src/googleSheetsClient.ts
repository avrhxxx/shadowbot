import { google } from "googleapis";

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  throw new Error("Brakuje zmiennej środowiskowej GOOGLE_SERVICE_ACCOUNT!");
}

// 🔹 Wczytaj dane konta serwisowego ze zmiennej środowiskowej
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheetsClient = google.sheets({ version: "v4", auth });