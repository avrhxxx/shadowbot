// =====================================
// 📁 src/systems/events/create/steps/confirmEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: CONFIRM EVENT
// Logika + UI w jednym pliku stepu
// ----------------------------
export function registerConfirmEventStep() {
  registerUIAction("events.create.confirm", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      // ----------------------------
      // Pobieramy parametry z custom_id
      // day, month, hours, minutes
      // ----------------------------
      const paramsString = interaction.customId.split("|")[1] || "";
      const paramsArray = paramsString.split("&");
      const day = Number(paramsArray[0]?.split("=")[1]);
      const month = Number(paramsArray[1]?.split("=")[1]);
      const hours = Number(paramsArray[2]?.split("=")[1]);
      const minutes = Number(paramsArray[3]?.split("=")[1]);

      // ----------------------------
      // Tworzymy datę UTC
      // ----------------------------
      const eventDate = getEventDateUTC(day, month, hours, minutes);
      const formatted = formatEventUTC(day, month, hours, minutes);

      // ----------------------------
      // Wyświetlamy UI z przyciskami potwierdzenia
      // ----------------------------
      await interaction.update({
        content: `✅ You are about to create the event for **${formatted}**.\nDo you want to notify the channel?`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "Yes, create & notify",
                style: 3, // success / green
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

      // ----------------------------
      // 🔹 W tym miejscu możemy triggerować kolejne stepy:
      // - submitEventStep() przy kliknięciu submit
      // - back do selectTimeStep() przy back
      // ----------------------------
    },
  });
}