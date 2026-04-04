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
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "hours",
            label: "Hours (0-23, UTC)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4,
            customId: "minutes",
            label: "Minutes (0-59, UTC)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
        ],
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

      const view = {
        content: `⏰ **${eventName}** time set for **${formatted}**`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "⬅ Back",
                style: 2,
                action: `events.create.selectDay|eventName=${encodeURIComponent(eventName)}`,
              },
              {
                type: 2,
                label: "🏠 Menu",
                style: 2,
                action: "events.create.backToMain",
              },
            ],
          },
        ],
      };

      await ctx.renderView(view, payload);
    },
  });
}