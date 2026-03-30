/**
 * 📁 File: src/system/absence/index.ts
 * 🧠 Role: public-api
 *
 * 📄 Description:
 * Publiczny punkt wejścia dla systemu absence.
 * Eksponuje WYŁĄCZNIE:
 * - handler (entrypoint)
 * - init (bootstrap systemu)
 * - kontrolowane API serwisu
 *
 * ❗ Brak logiki – tylko eksporty
 *
 * 📥 Input:
 * - inne systemy
 *
 * 📤 Output:
 * - publiczne API absence
 *
 * 🔗 Dependencies:
 * - absenceHandler
 * - absenceService
 *
 * 📡 Used by:
 * - systemRouter
 * - src/index.ts
 *
 * 🆔 Flow:
 * - traceId: NIE
 * - sessionId: NIE
 * - queueId: NIE
 *
 * 📊 Logging:
 * - logger: NIE
 *
 * ⚠️ Notes:
 * - NIE eksportujemy warstwy UI (buttons)
 * - init NIE powinien zależeć od buttons (layer violation)
 */

// =============================
// 🔹 HANDLER (ENTRY POINT)
// =============================

export { handleAbsenceInteraction } from "@/system/absence/absenceHandler";

// =============================
// 🔹 INIT (BOOTSTRAP)
// =============================

// ❗ TODO: przenieść logikę init poza buttons layer
export { initAbsenceNotifications } from "@/system/absence/absenceButtons/absenceNotification";

// =============================
// 🔹 DOMAIN SERVICE (CONTROLLED API)
// =============================

export {
  createAbsence,
  removeAbsence,
  getAbsences,
  getAbsenceByPlayer,
  getAbsenceConfig,
  setNotificationChannel,
  setAbsenceEmbedId,
} from "@/system/absence/absenceService";