// =====================================
// 📁 src/systems/events/create/steps/selectTime.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";
import { Interaction, ModalSubmitInteraction, ButtonInteraction } from "discord.js";

// 🔹 Funkcja generująca widok modala do wyboru czasu
export function selectTimeView(day: number, month: number) {
  return {
    title: `Set time for ${day}/${month} UTC`,
    custom_id: `events.create.selectTime.submit|day=${day}&month=${month}`,
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "hours",
            label: "Hours (0-23, UTC)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4,
            custom_id: "minutes",
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
    handler: async (interaction: ButtonInteraction) => {
      if (!interaction.isButton()) return;

      const paramsString = interaction.customId.split("|")[1] || "";
      const [dayParam, monthParam] = paramsString.split("&");
      const day = Number(dayParam.split("=")[1]);
      const month = Number(monthParam.split("=")[1]);

      const modal = selectTimeView(day, month);
      await interaction.showModal(modal);
    },
  });

  // Obsługa submitu modala
  registerUIAction("events.create.selectTime.submit", {
    system: "events",
    handler: async (interaction: ModalSubmitInteraction) => {
      if (!interaction.isModalSubmit()) return;

      const paramsString = interaction.customId.split("|")[1] || "";
      const [dayParam, monthParam] = paramsString.split("&");
      const day = Number(dayParam.split("=")[1]);
      const month = Number(monthParam.split("=")[1]);

      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply({
        content: `⏰ Event time set for **${formatted}**`,
        ephemeral: true,
      });
    },
  });
}