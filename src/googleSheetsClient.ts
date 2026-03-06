import { google } from "googleapis";
import path from "path";
import fs from "fs";

const CREDENTIALS_PATH = path.join(__dirname, "../credentials/google-service-account.json");

// Wczytaj plik JSON z konta usługi
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));

// Ustawienie klienta Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheetsClient = google.sheets({ version: "v4", auth });