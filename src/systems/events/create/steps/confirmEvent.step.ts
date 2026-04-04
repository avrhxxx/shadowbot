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
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "📢 Create & Notify",
            style: 3,
            action: `events.create.submit|notify=true&day=${day}&month=${month}&hours=${hours}&minutes=${minutes}`,
          },
          {
            type: 2,
            label: "✅ Create (silent)",
            style: 1,
            action: `events.create.submit|notify=false&day=${day}&month=${month}&hours=${hours}&minutes=${minutes}`,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "⬅ Back",
            style: 2,
            action: `events.create.selectTime|day=${day}&month=${month}`,
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
}

// =====================================
// 🚀 REGISTER STEP
// =====================================
export function registerConfirmEventStep() {
  registerUIAction("events.create.confirmEvent", {
    system: "events",
    handler: async (ctx, payload) => {
      // 🔹 Pobieramy parametry z payload, które UI Router już sparsował
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);

      const view = confirmEventView({ day, month, hours, minutes });

      // 🔹 Renderujemy przez UI Router / Engine
      await ctx.renderView(view, payload);
    },
  });
}