// =====================================
// 📁 src/systems/events/create/steps/selectTime.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// 🔹 Funkcja generująca widok modala do wyboru czasu
export function selectTimeView(day: number, month: number, eventName: string) {
  return {
    title: `⏰ Set time for **${eventName}** on ${day}/${month} UTC`,
    customId: `events.create.selectTime.submit|day=${day}&month=${month}&eventName=${encodeURIComponent(eventName)}`,
    fields: [
      {
        type: "number",
        name: "hours",
        label: "Hours (0-23, UTC)",
        min: 0,
        max: 23,
        required: true,
      },
      {
        type: "number",
        name: "minutes",
        label: "Minutes (0-59, UTC)",
        min: 0,
        max: 59,
        required: true,
      },
    ],
  };
}

// 🔹 Rejestracja kroku Select Time
export function registerSelectTimeStep() {
  // Pokaż modal wyboru czasu
  registerUIAction("events.create.selectTime", {
    system: "events",
    handler: async (ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const eventName = payload?.eventName ?? "Event";

      const modal = selectTimeView(day, month, eventName);
      await ctx.showModal?.(modal, payload);
    },
  });

  // Obsługa submitu modala
  registerUIAction("events.create.selectTime.submit", {
    system: "events",
    handler: async (ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const eventName = payload?.eventName ?? "Event";
      const hours = Number(payload?.hours);
      const minutes = Number(payload?.minutes);

      const formatted = formatEventUTC(day, month, hours, minutes);

      // 🔹 Przyciski po submit
      const buttons = [
        { label: "⬅ Back", action: `events.create.selectDay|eventName=${encodeURIComponent(eventName)}`, style: "secondary" },
        { label: "🏠 Menu", action: "events.create.backToMain", style: "secondary" },
      ];

      await ctx.renderView(`events.create.selectTime.result|${day}-${month}`, { content: `⏰ **${eventName}** time set for **${formatted}**`, buttons });
    },
  });
}