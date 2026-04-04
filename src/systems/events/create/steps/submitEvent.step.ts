// =====================================
// 📁 src/systems/events/create/steps/submitEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// 🔹 Funkcja generująca widok submitu eventu z przyciskiem notify
export function submitEventView(
  day: number,
  month: number,
  hours: number,
  minutes: number,
  eventName: string
) {
  const formatted = formatEventUTC(day, month, hours, minutes);

  return {
    content: `✅ You are about to create the event **${eventName}** scheduled for **${formatted}**.\nDo you want to notify the channel?`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Yes, create & notify",
            style: 3,
            action: `events.create.submit.confirm|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=true&eventName=${encodeURIComponent(eventName)}`,
          },
          {
            type: 2,
            label: "Yes, create without notification",
            style: 1,
            action: `events.create.submit.confirm|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=false&eventName=${encodeURIComponent(eventName)}`,
          },
          {
            type: 2,
            label: "⬅ Back",
            style: 2,
            action: `events.create.backToTime|day=${day}&month=${month}&eventName=${encodeURIComponent(eventName)}`,
          },
        ],
      },
    ],
  };
}

// 🔹 Rejestracja kroku submit event
export function registerSubmitEventStep() {
  registerUIAction("events.create.submit", {
    system: "events",
    handler: async (ctx, payload) => {
      // Pobieramy dane z payload
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const hours = Number(payload?.hours);
      const minutes = Number(payload?.minutes);
      const eventName = payload?.eventName ?? "Event";

      const view = submitEventView(day, month, hours, minutes, eventName);

      // 🔹 Renderujemy widok przez UI Engine / UI System
      await ctx.renderView(view, payload);
    },
  });
}