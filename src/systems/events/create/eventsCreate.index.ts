// =====================================
// 📁 src/systems/events/create/eventsCreate.index.ts
// =====================================

import { registerEventsCreateActions } from "./eventsCreate.action";

// ----------------------------
// IMPORT STEPOW Z JEDNEGO PUNKTU
// ----------------------------
import {
  registerSelectDayStep,
  registerSelectTimeStep,
  registerSubmitEventStep,
  registerBirthdayFormStep,
  registerCustomEventFormStep,
  registerConfirmEventStep,
} from "./steps";

// ----------------------------
// INIT CREATE FEATURE
// ----------------------------
export function initEventsCreateFeature() {
  // 🔹 Akcja startowa: Create Event
  registerEventsCreateActions();

  // 🔹 Rejestracja wszystkich stepów feature
  registerSelectDayStep();
  registerSelectTimeStep();
  registerSubmitEventStep();
  registerBirthdayFormStep();
  registerCustomEventFormStep();
  registerConfirmEventStep();
}