// =====================================
// 📁 src/systems/events/create/eventsCreate.index.ts
// =====================================

import { registerEventsCreateActions } from "./eventsCreate.action";

// ----------------------------
// INIT CREATE FEATURE
// ----------------------------
export function initEventsCreateFeature() {
  // 🔹 Akcja startowa: Create Event
  registerEventsCreateActions();

  // 🔹 Wszystkie widoki i akcje są teraz rejestrowane w registerEventsCreateActions()
  // Nie potrzebujemy już żadnych osobnych "stepów"
}