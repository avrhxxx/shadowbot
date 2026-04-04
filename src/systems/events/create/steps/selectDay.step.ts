// =====================================
// 📁 src/systems/events/create/steps/selectDay.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatButtonDate } from "@/shared/utils/timeUtils";

const DAYS_TO_SHOW = 8;

// 🔹 Funkcja generująca widok Select Day (do użycia w action)
export function selectDayView() {
  const today = new Date();
  const buttons = [];

  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
    const label = formatButtonDate(date.getUTCDate(), date.getUTCMonth() + 1);
    const action = `events.create.selectTime|day=${date.getUTCDate()}&month=${date.getUTCMonth() + 1}`;

    buttons.push({ label, action, style: "primary" });
  }

  // 🔹 Dodajemy przycisk Back
  buttons.push({ label: "⬅ Back", action: "events.create.backToType", style: "secondary" });

  return {
    content: "📅 **Select a day for your event:**",
    buttons,
  };
}

// 🔹 Rejestracja kroku Select Day
export function registerSelectDayStep() {
  registerUIAction("events.create.selectDay", {
    system: "events",
    handler: async (ctx, _payload) => {
      const view = selectDayView();
      await ctx.renderView("events.create.selectDay.result", view);
    },
  });
}