// =====================================
// 📁 src/system/absence/index.ts
// =====================================

/**
 * 🚪 ROLE:
 * Public API for Absence system
 *
 * Exposes ONLY what external systems should use.
 * Internal structure stays hidden.
 *
 * ❗ RULES:
 * - NO logic here
 * - ONLY exports
 */

// =============================
// 🔹 HANDLERS (ENTRY POINTS)
// =============================

export { handleAbsenceInteraction } from "./absenceHandler";

// =============================
// 🔹 INIT
// =============================

export { initAbsenceNotifications } from "./absenceButtons/absenceNotification";

// =============================
// 🔹 PANEL
// =============================

export * from "./absencePanel";

// =============================
// 🔹 SERVICE (OPTIONAL PUBLIC)
// =============================

export * from "./absenceService";

// =============================
// 🔹 BUTTONS (INTERNAL API)
// =============================

// ⚠️ Export only if used outside
export * from "./absenceButtons";