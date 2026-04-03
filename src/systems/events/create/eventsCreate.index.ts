// =====================================
// 📁 src/systems/events/create/eventsCreate.index.ts
// =====================================

import { registerEventsCreateActions } from "./eventsCreate.action";

// ----------------------------
// IMPORT STEPOW
// ----------------------------
import { registerSelectDayStep } from "./steps/selectDay.step";
import { registerSelectTimeStep } from "./steps/selectTime.step";
import { registerSubmitEventStep } from "./steps/submitEvent.step";
import { registerBirthdayFormStep } from "./steps/birthdayForm.step";
import { registerCustomEventFormStep } from "./steps/customEventForm.step";
import { registerConfirmEventStep } from "./steps/confirmEvent.step";

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