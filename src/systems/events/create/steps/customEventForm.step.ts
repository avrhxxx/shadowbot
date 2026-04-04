// =====================================
// 📁 src/systems/events/create/steps/customEventForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// =====================================
// 🧠 VIEW
// =====================================
export function customEventFormView() {
  return {
    title: "📝 Custom Event",
    customId: "events.create.customForm.submit",
    components: [
      {
        type: 1,
        components: [
          { type: 4, customId: "name", style: 1, label: "Event Name", placeholder: "Enter event name", required: true },
          { type: 4, customId: "day", style: 1, label: "Day", placeholder: "1-31", required: true },
          { type: 4, customId: "month", style: 1, label: "Month", placeholder: "1-12", required: true },
          { type: 4, customId: "hours", style: 1, label: "Hours", placeholder: "0-23", required: true },
          { type: 4, customId: "minutes", style: 1, label: "Minutes", placeholder: "0-59", required: true },
        ],
      },
    ],
  };
}

// =====================================
// 🚀 REGISTER STEP
// =====================================
export function registerCustomEventFormStep() {
  // 🔹 Otwarcie formularza Custom Event
  registerUIAction("events.create.customEventForm", {
    system: "events",
    handler: async (ctx, payload) => {
      // renderujemy modal poprzez UI Engine
      await ctx.showModal?.(customEventFormView(), payload);
    },
  });

  // 🔹 Submit formularza Custom Event
  registerUIAction("events.create.customForm.submit", {
    system: "events",
    handler: async (ctx, payload) => {
      // 🔹 Parametry formularza z payload
      const name = payload?.name ?? "Unnamed Event";
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);

      const formatted = formatEventUTC(day, month, hours, minutes);

      // 🔹 Tworzymy widok końcowy
      const view = {
        content: `📝 Event: **${name}**\n📅 Date: **${formatted}**`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "⬅ Back",
                style: 2,
                action: "events.create.backToMain",
              },
            ],
          },
        ],
      };

      // 🔹 Renderujemy widok przez UI Engine
      await ctx.renderView(view, payload);
    },
  });
}