// src/absencePanel/absenceService.ts (debugowana wersja)

import * as GS from "../googleSheetsStorage";

export interface AbsenceObject {
  id: string;
  guildId: string;
  player: string;
  startDate: string;
  endDate: string;
  createdAt: number;
  notified: boolean;
}

// -----------------------------
// REMOVE ABSENCE BY PLAYER (DEBUG)
// -----------------------------
export async function removeAbsence(guildId: string, player: string): Promise<boolean> {
  console.log(`[removeAbsence] guildId=${guildId}, player=${player}`);

  // Pobierz listę absencji
  const absences = await loadAbsences(guildId);
  console.log("[removeAbsence] Loaded absences:", absences);

  // Znajdź rekord po nicku
  const target = absences.find(a => a.player.toLowerCase() === player.toLowerCase());

  if (!target) {
    console.warn(`[removeAbsence] No matching absence found for player: ${player}`);
    return false;
  }

  console.log(`[removeAbsence] Found target absence:`, target);

  // Usuń rekord po ID
  const deleted = await deleteAbsenceRow(target.id);
  console.log(`[removeAbsence] deleteAbsenceRow returned:`, deleted);

  return deleted;
}

// -----------------------------
// DELETE ABSENCE ROW (DEBUG)
// -----------------------------
export async function deleteAbsenceRow(absenceId: string): Promise<boolean> {
  console.log(`[deleteAbsenceRow] Trying to delete absenceId=${absenceId}`);

  const rows: any[][] = await GS.readAbsenceSheet();
  if (!rows.length) {
    console.warn("[deleteAbsenceRow] No rows found in absence sheet.");
    return false;
  }

  const headers = rows[0];
  const idIndex = headers.indexOf("id");
  if (idIndex === -1) {
    console.error("[deleteAbsenceRow] Column 'id' not found in headers:", headers);
    return false;
  }

  const rowIndex = rows.findIndex(r => r[idIndex] === absenceId);
  if (rowIndex === -1) {
    console.warn(`[deleteAbsenceRow] Could not find row with id=${absenceId}. Current IDs:`, rows.slice(1).map(r => r[idIndex]));
    return false;
  }

  console.log(`[deleteAbsenceRow] Found rowIndex=${rowIndex} for absenceId=${absenceId}, deleting...`);
  await GS.deleteAbsenceRow(rowIndex + 1);

  console.log(`[deleteAbsenceRow] Row deleted successfully.`);
  return true;
}