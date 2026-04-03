// =====================================
// 📁 src/systems/events/create/eventsCreate.index.ts
// =====================================

import { registerEventsCreateActions } from "./eventsCreate.action";
import { registerSelectDayStep } from "./steps/selectDay.step";
import { registerSelectTimeStep } from "./steps/selectTime.step";
import { registerSubmitEventStep } from "./steps/submitEvent.step";

// ----------------------------
// INIT CREATE FEATURE
// ----------------------------
export function initEventsCreateFeature() {
  // Akcja startowa: Create Event
  registerEventsCreateActions();

  // Steps
  registerSelectDayStep();
  registerSelectTimeStep();
  registerSubmitEventStep();
}