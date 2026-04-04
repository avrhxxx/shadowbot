// =====================================
// 📁 src/systems/events/create/steps/confirmEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";
import { Interaction, ButtonInteraction } from "discord.js";

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
    handler: async (interaction: Interaction) => {
      if (!interaction.isButton()) return;

      const button = interaction as ButtonInteraction;

      const paramsString = button.customId.split("|")[1] || "";
      const params = paramsString.split("&").reduce((acc, cur) => {
        const [k, v] = cur.split("=");
        acc[k] = v;
        return acc;
      }, {} as Record<string, string>);

      const day = Number(params.day);
      const month = Number(params.month);
      const hours = Number(params.hours);
      const minutes = Number(params.minutes);

      const view = confirmEventView({ day, month, hours, minutes });

      await button.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}