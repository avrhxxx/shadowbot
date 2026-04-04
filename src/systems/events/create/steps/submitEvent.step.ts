// =====================================
// 📁 src/systems/events/create/steps/submitEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";
import { ButtonInteraction, Interaction } from "discord.js";

// 🔹 Funkcja generująca widok submitu eventu z przyciskiem notify
export function submitEventView(day: number, month: number, hours: number, minutes: number) {
  const formatted = formatEventUTC(day, month, hours, minutes);

  return {
    content: `✅ You are about to create the event for **${formatted}**.\nDo you want to notify the channel?`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Yes, create & notify",
            style: 3,
            custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=true`,
          },
          {
            type: 2,
            label: "Yes, create without notification",
            style: 1,
            custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=false`,
          },
          {
            type: 2,
            label: "⬅ Back",
            style: 2,
            custom_id: `events.create.backToTime|day=${day}&month=${month}`,
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
    handler: async (interaction: Interaction) => {
      if (!interaction.isButton() && !interaction.isModalSubmit()) return;

      const paramsString = interaction.customId.split("|")[1] || "";
      const params = paramsString.split("&").reduce<Record<string, string>>((acc, cur) => {
        const [k, v] = cur.split("=");
        acc[k] = v;
        return acc;
      }, {});

      const day = Number(params.day);
      const month = Number(params.month);
      const hours = Number(params.hours);
      const minutes = Number(params.minutes);
      const notify = params.notify === "true";

      const view = submitEventView(day, month, hours, minutes);

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}