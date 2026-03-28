// =====================================
// 📁 src/system/absence/index.ts
// =====================================

// 🎯 INTERACTIONS
export { handleAbsenceInteraction } from "../../absencePanel/absenceHandler";

// 🔔 NOTIFICATIONS (init w clientReady)
export { initAbsenceNotifications } from "../../absencePanel/absenceButtons/absenceNotification";

// 🧠 SERVICE (opcjonalnie – przydatne globalnie)
export * from "../../absencePanel/absenceService";