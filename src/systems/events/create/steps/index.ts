// =====================================
// 📁 src/systems/events/create/steps/index.ts
// =====================================

// 🔹 Steps
export { registerSelectDayStep } from "./selectDay.step";
export { registerSelectTimeStep } from "./selectTime.step";
export { registerSubmitEventStep } from "./submitEvent.step";
export { registerBirthdayFormStep } from "./birthdayForm.step";
export { registerCustomEventFormStep } from "./customEventForm.step";
export { registerConfirmEventStep } from "./confirmEvent.step";

// 🔹 Views
export { selectDayView } from "./selectDay.step";
export { selectTimeView } from "./selectTime.step";
export { submitEventView } from "./submitEvent.step";
export { birthdayFormView } from "./birthdayForm.step";
export { customEventFormView } from "./customEventForm.step";
export { confirmEventView } from "./confirmEvent.step";

// 🔹 Mapa do łatwego użycia
export const StepsMap = {
  selectDay: {
    step: registerSelectDayStep,
    view: () => selectDayView(),
  },
  selectTime: {
    step: registerSelectTimeStep,
    view: (params: { day: number; month: number }) => selectTimeView(params.day, params.month),
  },
  submitEvent: {
    step: registerSubmitEventStep,
    view: (params: { day: number; month: number; hours: number; minutes: number }) =>
      submitEventView(params.day, params.month, params.hours, params.minutes),
  },
  birthdayForm: {
    step: registerBirthdayFormStep,
    view: () => birthdayFormView(),
  },
  customEventForm: {
    step: registerCustomEventFormStep,
    view: () => customEventFormView(),
  },
  confirmEvent: {
    step: registerConfirmEventStep,
    view: (params: { day: number; month: number; hours: number; minutes: number }) =>
      confirmEventView(params),
  },
};