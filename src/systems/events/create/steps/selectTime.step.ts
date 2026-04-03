// =====================================
// 📁 src/systems/events/create/steps/selectTime.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: SELECT TIME
// Logika + UI w jednym pliku
// ----------------------------
export function registerSelectTimeStep() {
  // Handler dla przycisku wyboru dnia
  registerUIAction("events.create.selectTime", {
    system: "events",
    handler: async (interaction: ButtonInteraction, ctx: TraceContext) => {
      if (!interaction.isButton()) return;

      const [params] = interaction.customId.split("|").slice(1);
      const day = Number(params.split("&")[0].split("=")[1]);
      const month = Number(params.split("&")[1].split("=")[1]);

      // Tworzymy modal bez importu z zewnątrz
      const modal = {
        title: `Set time for ${day}/${month} UTC`,
        custom_id: `events.create.selectTime.submit|day=${day}&month=${month}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 4, // TextInput
                custom_id: "hours",
                label: "Hours (0-23, UTC)",
                style: 1, // short
                min_length: 1,
                max_length: 2,
                required: true,
              },
              {
                type: 4,
                custom_id: "minutes",
                label: "Minutes (0-59, UTC)",
                style: 1, // short
                min_length: 1,
                max_length: 2,
                required: true,
              },
            ],
          },
        ],
      };

      await interaction.showModal(modal);
    },
  });

  // Handler submit modala
  registerUIAction("events.create.selectTime.submit", {
    system: "events",
    handler: async (interaction: ModalSubmitInteraction, ctx: TraceContext) => {
      if (!interaction.isModalSubmit()) return;

      const [params] = interaction.customId.split("|").slice(1);
      const day = Number(params.split("&")[0].split("=")[1]);
      const month = Number(params.split("&")[1].split("=")[1]);

      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));

      // Tworzymy datę UTC
      const eventDate = getEventDateUTC(day, month, hours, minutes);
      const formatted = formatEventUTC(day, month, hours, minutes);

      // Wyświetlamy podsumowanie
      await interaction.reply({
        content: `⏰ Event time set for **${formatted}**`,
        ephemeral: true,
      });

      // 🔹 Tutaj można od razu triggerować kolejny step np. confirmEvent
    },
  });
}