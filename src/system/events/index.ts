// =====================================
// 📁 src/system/events/index.ts
// =====================================

/**
 * 🚪 Public API for Events system
 */

// =============================
// 🔹 HANDLERS
// =============================

export { handleEventInteraction } from "./eventHandlers";

// =============================
// 🔹 INIT
// =============================

export { initEventReminders } from "./eventsButtons/eventsReminder";

// =============================
// 🔹 PANEL
// =============================

export { renderEventPanel } from "./eventPanel";

// =============================
// 🔹 DOMAIN SERVICE (CONTROLLED API)
// =============================

export {
  getEvents,
  getEventById,
  createEvent,
  deleteEvent,
  updateEvent,
  cancelEvent,
  addParticipants,
  removeParticipants,
  markAbsent,
  addResults,
  saveEvents,
  checkAndSetReminder,
  getConfig,
  setNotificationChannel,
  setDownloadChannel,
} from "./eventService";