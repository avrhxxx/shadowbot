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

    buttons.push({
      type: 2,
      label,
      style: 1,
      action,
    });
  }

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5).map(btn => ({ ...btn })) });
  }

  rows.push({
    type: 1,
    components: [{ type: 2, label: "⬅ Back", style: 2, action: "events.create.backToType" }],
  });

  return {
    content: "📅 **Select a day for your event:**",
    components: rows,
  };
}

// 🔹 Rejestracja kroku Select Day
export function registerSelectDayStep() {
  registerUIAction("events.create.selectDay", {
    system: "events",
    handler: async (ctx, payload) => {
      // render widoku poprzez UI Engine
      const view = selectDayView();
      await ctx.renderView(view, payload);
    },
  });
}