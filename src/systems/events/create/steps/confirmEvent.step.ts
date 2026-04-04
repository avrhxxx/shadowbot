// =====================================
// 📁 src/systems/events/create/steps/confirmEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// =====================================
// 🧠 VIEW
// =====================================
export function confirmEventView(params: {
  day: number;
  month: number;
  hours: number;
  minutes: number;
}) {
  const { day, month, hours, minutes } = params;
  const formatted = formatEventUTC(day, month, hours, minutes);

  return {
    content: `✅ **Confirm Event**\n\nEvent date: **${formatted}**\n\nDo you want to notify the channel?`,
    buttons: [
      {
        label: "📢 Create & Notify",
        action: `events.create.submit|notify=true&day=${day}&month=${month}&hours=${hours}&minutes=${minutes}`,
        style: "danger",
      },
      {
        label: "✅ Create (silent)",
        action: `events.create.submit|notify=false&day=${day}&month=${month}&hours=${hours}&minutes=${minutes}`,
        style: "primary",
      },
      {
        label: "⬅ Back",
        action: `events.create.selectTime|day=${day}&month=${month}`,
        style: "secondary",
      },
      {
        label: "🏠 Menu",
        action: "events.create.backToMain",
        style: "secondary",
      },
    ],
  };
}

// =====================================
// 🚀 REGISTER STEP
// =====================================
export function registerConfirmEventStep() {
  registerUIAction("events.create.confirmEvent", {
    system: "events",
    handler: async (ctx, _unused, payload) => {
      // 🔹 Pobieramy parametry z payload, które UI Router już sparsował
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);

      const view = confirmEventView({ day, month, hours, minutes });

      // 🔹 Renderujemy przez UI Engine z unikalnym viewId
      await ctx.renderView("events.create.confirmEvent.result", view);
    },
  });
}