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
            custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=true`,
          },
          {
            type: 2,
            label: "✅ Create (silent)",
            style: 1,
            custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=false`,
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
            custom_id: `events.create.selectTime|day=${day}&month=${month}`,
          },
          {
            type: 2,
            label: "🏠 Menu",
            style: 2,
            custom_id: "events.create.backToMain",
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
    handler: async (interaction, ctx, payload) => {
      // 🔹 Pobieramy parametry z payload, które UI Router już sparsował
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);

      const view = confirmEventView({ day, month, hours, minutes });

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}