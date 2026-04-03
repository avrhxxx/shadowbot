// =====================================
// 🔹 LOCATION: src/systems/events/create/steps/confirmEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ButtonInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: CONFIRM EVENT
// ----------------------------
export function registerConfirmEventStep() {
  registerUIAction("events.create.confirm", {
    system: "events",
    handler: async (interaction: ButtonInteraction, ctx: TraceContext) => {
      if (!interaction.isButton()) return;

      // Pobieramy parametry z custom_id (day, month, hours, minutes)
      const [params] = interaction.customId.split("|").slice(1);
      const day = Number(params.split("&")[0].split("=")[1]);
      const month = Number(params.split("&")[1].split("=")[1]);
      const hours = Number(params.split("&")[2].split("=")[1]);
      const minutes = Number(params.split("&")[3].split("=")[1]);

      // Tworzymy datę UTC
      const eventDate = getEventDateUTC(day, month, hours, minutes);
      const formatted = formatEventUTC(day, month, hours, minutes);

      // Wyświetlamy przyciski potwierdzenia
      await interaction.update({
        content: `✅ You are about to create the event for **${formatted}**.\nDo you want to notify the channel?`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "Yes, create & notify",
                style: 3, // green
                custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=true`,
              },
              {
                type: 2,
                label: "Yes, create without notification",
                style: 1, // primary
                custom_id: `events.create.submit|day=${day}&month=${month}&hours=${hours}&minutes=${minutes}&notify=false`,
              },
              {
                type: 2,
                label: "⬅ Back",
                style: 2, // secondary
                custom_id: `events.create.backToTime|day=${day}&month=${month}`,
              },
            ],
          },
        ],
      });
    },
  });
}