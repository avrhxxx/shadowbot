// =====================================
// 📁 src/system/absence/index.ts
// =====================================

/**
 * 🚪 PUBLIC API – Absence System
 */

// =============================
// 🔹 HANDLER (ENTRY POINT)
// =============================

export { handleAbsenceInteraction } from "./absenceHandler";

// =============================
// 🔹 INIT
// =============================

export { initAbsenceNotifications } from "./absenceButtons/absenceNotification";

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
} from "./absenceService";