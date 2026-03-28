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
// 🔹 DOMAIN SERVICE (IMPORTANT)
// =============================

export * from "./absenceService";