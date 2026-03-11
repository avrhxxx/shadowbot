import * as GS from "../googleSheetsStorage";

export interface AbsenceObject {
  id: string;
  guildId: string;
  player: string;
  startDate: string;
  endDate: string;
  createdAt: number;
  year: number; // zawsze bieżący rok
}

export interface AbsenceConfig {
  notificationChannel?: string;
  absenceEmbedId?: string;
  [key: string]: any;
}

function toNumber(value: any, fallback = 0) { return value != null ? Number(value) : fallback; }

export async function loadAbsences(guildId: string): Promise<AbsenceObject[]> {
  const rows: any[][] = await GS.readAbsenceSheet();
  if (!rows.length) return [];
  const headers: string[] = rows[0];

  return rows.slice(1)
    .map((row: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => obj[h] = row[i] ?? null);
      return {
        id: obj.id,
        guildId: obj.guildId,
        player: obj.player,
        startDate: obj.startDate,
        endDate: obj.endDate,
        year: obj.year ? Number(obj.year) : new Date().getFullYear(),
        createdAt: toNumber(obj.createdAt),
      } as AbsenceObject;
    })
    .filter(a => a.guildId === guildId);
}

export async function getAbsences(guildId: string) { return loadAbsences(guildId); }

export async function getAbsenceByPlayer(guildId: string, player: string): Promise<AbsenceObject | null> {
  const absences = await loadAbsences(guildId);
  return absences.find(a => a.player.toLowerCase() === player.toLowerCase()) || null;
}

export async function createAbsence(data: AbsenceObject): Promise<AbsenceObject> {
  const existing = await getAbsenceByPlayer(data.guildId, data.player);
  if (existing) throw new Error(`Player ${data.player} is already on absence list.`);

  const rows = await GS.readAbsenceSheet();
  const headers = rows[0] ?? ["id","guildId","player","startDate","endDate","year","createdAt"];
  const newRow = headers.map(h => {
    if (h === "year") return data.year ?? new Date().getFullYear();
    if (h === "createdAt") return data.createdAt ?? Date.now();
    return (data as any)[h] ?? "";
  });

  await GS.writeAbsenceSheet([headers, ...rows.slice(1), newRow]);
  return data;
}

export async function deleteAbsenceRow(absenceId: string) {
  const rows: any[][] = await GS.readAbsenceSheet();
  if (!rows.length) return;
  const headers = rows[0];
  const idIndex = headers.indexOf("id");
  if (idIndex === -1) throw new Error("Column 'id' not found");
  const rowIndex = rows.findIndex(r => r[idIndex] === absenceId);
  if (rowIndex === -1) return;
  await GS.deleteAbsenceRow(rowIndex + 1);
}

export async function removeAbsence(guildId: string, player: string): Promise<AbsenceObject | null> {
  const absences = await loadAbsences(guildId);
  const target = absences.find(a => a.player.toLowerCase() === player.toLowerCase());
  if (!target) return null;
  await deleteAbsenceRow(target.id);
  return target;
}

// -------------------------
// CONFIG
// -------------------------
export async function getAbsenceConfig(guildId: string): Promise<AbsenceConfig> {
  const rows = await GS.readAbsenceConfigSheet();
  if (!rows.length) return {};
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const guildIndex = headers.indexOf("guildId");
  if (guildIndex === -1) return {};
  const row = dataRows.find(r => r[guildIndex] === guildId);
  if (!row) return {};
  const config: AbsenceConfig = {};
  headers.forEach((h, i) => (config[h] = row[i] ?? null));
  return config;
}

export async function setNotificationChannel(guildId: string, channelId: string) {
  await setConfig(guildId, "notificationChannel", channelId);
}

export async function setAbsenceEmbedId(guildId: string, messageId: string) {
  await setConfig(guildId, "absenceEmbedId", messageId);
}

export async function setConfig(guildId: string, key: string, value: any) {
  const rows = await GS.readAbsenceConfigSheet();
  const headers = rows[0] ?? ["guildId", "notificationChannel"];
  const dataRows = rows.slice(1);

  if (!headers.includes(key)) {
    headers.push(key);
    for (const r of dataRows) while (r.length < headers.length) r.push("");
  }

  const guildIndex = headers.indexOf("guildId");
  const keyIndex = headers.indexOf(key);

  let row = dataRows.find(r => r[guildIndex] === guildId);
  let rowIndex: number;

  if (!row) {
    row = new Array(headers.length).fill("");
    row[guildIndex] = guildId;
    dataRows.push(row);
    rowIndex = dataRows.length;
  } else {
    rowIndex = dataRows.indexOf(row) + 1;
  }

  await GS.writeAbsenceConfigSheet([headers, ...dataRows]);
  await GS.updateAbsenceConfigCell(rowIndex + 1, keyIndex + 1, value);
}