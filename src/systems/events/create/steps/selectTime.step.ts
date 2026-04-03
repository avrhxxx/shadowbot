// =====================================
// 📁 src/systems/events/create/steps/selectTime.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: SELECT TIME
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

      // Lazy import widoku
      const { selectTimeView } = await import("../stepsViews/selectTime.view");
      await interaction.showModal(selectTimeView(day, month));
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

      // Tutaj możemy triggerować kolejny step np. confirmEvent
    },
  });
}