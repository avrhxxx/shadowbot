// =====================================
// 📁 src/systems/events/create/steps/submitEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// 🔹 Funkcja generująca widok submitu eventu z przyciskami
export function submitEventView(
  day: number,
  month: number,
  hours: number,
  minutes: number,
  eventName: string
) {
  const formatted = formatEventUTC(day, month, hours, minutes);

  const buttons = [
    {
      label: "Yes, create & notify",
      action: `events.create.submit.confirm|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=true&eventName=${encodeURIComponent(eventName)}`,
      style: "primary",
    },
    {
      label: "Yes, create without notification",
      action: `events.create.submit.confirm|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=false&eventName=${encodeURIComponent(eventName)}`,
      style: "primary",
    },
    {
      label: "⬅ Back",
      action: `events.create.backToTime|day=${day}&month=${month}&eventName=${encodeURIComponent(eventName)}`,
      style: "secondary",
    },
  ];

  return {
    content: `✅ You are about to create the event **${eventName}** scheduled for **${formatted}**.\nDo you want to notify the channel?`,
    buttons,
  };
}

// 🔹 Rejestracja kroku submit event
export function registerSubmitEventStep() {
  registerUIAction("events.create.submit", {
    system: "events",
    handler: async (ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);
      const hours = Number(payload?.hours);
      const minutes = Number(payload?.minutes);
      const eventName = payload?.eventName ?? "Event";

      const view = submitEventView(day, month, hours, minutes, eventName);

      // 🔹 Render widoku z unikalnym viewId
      await ctx.renderView(`events.create.submit|${day}-${month}-${hours}-${minutes}`, view);
    },
  });
}