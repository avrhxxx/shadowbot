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
          { type: 4, customId: "eventName", style: 1, label: "Event Name", placeholder: "Enter event name", required: true },
          { type: 4, customId: "day", style: 1, label: "Day", placeholder: "Enter day (1-31)", required: true },
          { type: 4, customId: "month", style: 1, label: "Month", placeholder: "Enter month (1-12)", required: true },
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
    handler: async (interaction, ctx) => {
      // renderujemy modal poprzez UI Engine
      await interaction.showModal?.(customEventFormView());
    },
  });

  // 🔹 Submit formularza Custom Event
  registerUIAction("events.create.customForm.submit", {
    system: "events",
    handler: async (interaction, ctx, payload) => {
      // 🔹 Parametry formularza z payload
      const eventName = payload?.eventName ?? "Unnamed Event";
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply?.({
        content: `**${formatted}** 📝 Custom Event: **${eventName}**`,
        ephemeral: true,
      });
    },
  });
}