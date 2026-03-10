import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// --------------------------
// TABS
// --------------------------
const MODERATOR_CONFIG_TAB = "moderator_config";
const EVENTS_TAB = "events";
const EVENTS_CONFIG_TAB = "events_config";
const ABSENCE_TAB = "absence";
const ABSENCE_CONFIG_TAB = "absence_config";

// --------------------------
// VALIDACJA ENV
// --------------------------
if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID env variable is missing");
if (!process.env.GOOGLE_SERVICE_ACCOUNT) throw new Error("GOOGLE_SERVICE_ACCOUNT env variable is missing");

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// --------------------------
// UTILS
// --------------------------
async function readSheet(tab: string): Promise<any[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tab,
  });
  return res.data.values || [];
}

async function writeSheet(tab: string, values: any[][]) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// --------------------------
// EVENTS STORAGE
// --------------------------
export async function readEventsSheet(): Promise<any[][]> {
  return await readSheet(EVENTS_TAB);
}

export async function writeEventsSheet(values: any[][]) {
  await writeSheet(EVENTS_TAB, values);
}

export async function readConfigSheet(): Promise<any[][]> {
  return await readSheet(EVENTS_CONFIG_TAB);
}

export async function writeConfigSheet(values: any[][]) {
  await writeSheet(EVENTS_CONFIG_TAB, values);
}

export async function updateEventCell(row: number, col: number, value: any) {
  const range = `${EVENTS_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function updateConfigCell(row: number, col: number, value: any) {
  const range = `${EVENTS_CONFIG_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function deleteEventRow(row: number) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: "ROWS",
              startIndex: row - 1,
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}

// --------------------------
// MODERATOR CONFIG STORAGE
// --------------------------
export async function ensureModeratorConfigHeaders() {
  const rows = await readSheet(MODERATOR_CONFIG_TAB);
  if (!rows || rows.length === 0 || rows[0].length === 0) {
    const headers = [["modChannelId", "dateEmbedId", "hubMessageId", "updateChannelId", "lastUpdated", "version"]];
    await writeSheet(`${MODERATOR_CONFIG_TAB}!A1:F1`, headers);
  }
}

export async function readModeratorConfig(): Promise<any[][]> {
  await ensureModeratorConfigHeaders();
  return await readSheet(MODERATOR_CONFIG_TAB);
}

export async function saveModeratorPanelInfo(
  modChannelId: string,
  dateEmbedId: string,
  hubMessageId: string,
  updateChannelId: string,
  lastUpdated: number,
  version?: string
) {
  const values = [[modChannelId, dateEmbedId, hubMessageId, updateChannelId, lastUpdated, version || "1.0.0"]];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${MODERATOR_CONFIG_TAB}!A2:F2`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export async function updateModeratorConfigCell(row: number, col: number, value: any) {
  const range = `${MODERATOR_CONFIG_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function getModeratorPanelInfo(): Promise<{
  modChannelId: string;
  dateEmbedId: string;
  hubMessageId: string;
  updateChannelId: string;
  lastUpdated: number;
  version?: string;
} | null> {
  const rows = await readModeratorConfig();
  if (!rows || rows.length < 2) return null;

  const [modChannelId, dateEmbedId, hubMessageId, updateChannelId, lastUpdated, version] = rows[1];
  return {
    modChannelId,
    dateEmbedId,
    hubMessageId,
    updateChannelId,
    lastUpdated: Number(lastUpdated),
    version: version || "1.0.0",
  };
}

export async function updateModeratorPanelColumn(
  col: "modChannelId" | "dateEmbedId" | "hubMessageId" | "updateChannelId" | "lastUpdated" | "version",
  value: string | number
) {
  const colMap: Record<typeof col, number> = {
    modChannelId: 1,
    dateEmbedId: 2,
    hubMessageId: 3,
    updateChannelId: 4,
    lastUpdated: 5,
    version: 6,
  };
  await updateModeratorConfigCell(2, colMap[col], value);
}

// --------------------------
// ABSENCE STORAGE
// --------------------------
export async function readAbsenceSheet(): Promise<any[][]> {
  return await readSheet(ABSENCE_TAB);
}

export async function writeAbsenceSheet(values: any[][]) {
  await writeSheet(ABSENCE_TAB, values);
}

export async function readAbsenceConfigSheet(): Promise<any[][]> {
  return await readSheet(ABSENCE_CONFIG_TAB);
}

export async function writeAbsenceConfigSheet(values: any[][]) {
  await writeSheet(ABSENCE_CONFIG_TAB, values);
}

export async function updateAbsenceCell(row: number, col: number, value: any) {
  const range = `${ABSENCE_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function updateAbsenceConfigCell(row: number, col: number, value: any) {
  const range = `${ABSENCE_CONFIG_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function deleteAbsenceRow(row: number) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: "ROWS",
              startIndex: row - 1,
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}

export async function ensureAbsenceConfigHeaders() {
  const rows = await readSheet(ABSENCE_CONFIG_TAB);
  if (!rows || rows.length === 0 || rows[0].length === 0) {
    const headers = [["guildId", "notificationChannel", "otherSetting1", "otherSetting2"]];
    await writeSheet(`${ABSENCE_CONFIG_TAB}!A1:D1`, headers);
  }
}

export async function readAbsenceConfig(): Promise<any[][]> {
  await ensureAbsenceConfigHeaders();
  return await readSheet(ABSENCE_CONFIG_TAB);
}

// --------------------------
// HELPERS
// --------------------------
function toA1(col: number, row: number): string {
  let result = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    col = Math.floor((col - 1) / 26);
  }
  return result + row;
}