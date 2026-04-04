// =====================================
// 📁 src/systems/events/create/steps/selectTime.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// 🔹 Funkcja generująca widok modala do wyboru czasu
export function selectTimeView(day: number, month: number) {
  return {
    title: `Set time for ${day}/${month} UTC`,
    customId: `events.create.selectTime.submit|day=${day}&month=${month}`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "hours",
            label: "Hours (0-23, UTC)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4,
            customId: "minutes",
            label: "Minutes (0-59, UTC)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
        ],
      },
    ],
  };
}

// 🔹 Rejestracja kroku Select Time
export function registerSelectTimeStep() {
  // Pokaż modal wyboru czasu
  registerUIAction("events.create.selectTime", {
    system: "events",
    handler: async (interaction, ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);

      const modal = selectTimeView(day, month);
      await interaction.showModal?.(modal);
    },
  });

  // Obsługa submitu modala
  registerUIAction("events.create.selectTime.submit", {
    system: "events",
    handler: async (interaction, ctx, payload) => {
      const day = Number(payload?.day);
      const month = Number(payload?.month);

      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply?.({
        content: `⏰ Event time set for **${formatted}**`,
        ephemeral: true,
      });
    },
  });
}