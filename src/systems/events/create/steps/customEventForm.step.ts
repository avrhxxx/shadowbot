// =====================================
// 📁 src/systems/events/create/steps/customEventForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ModalSubmitInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: CUSTOM EVENT FORM
// Logika + UI w jednym pliku stepu
// ----------------------------
export function registerCustomEventFormStep() {
  registerUIAction("events.create.customForm.submit", {
    system: "events",
    handler: async (interaction: ModalSubmitInteraction, ctx: TraceContext) => {
      if (!interaction.isModalSubmit()) return;

      // ----------------------------
      // Pobieramy dane z formularza
      // ----------------------------
      const day = Number(interaction.fields.getTextInputValue("day"));
      const month = Number(interaction.fields.getTextInputValue("month"));
      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));
      const title = interaction.fields.getTextInputValue("title");
      const description = interaction.fields.getTextInputValue("description");
      const notify = interaction.fields.getTextInputValue("notify") === "yes";

      // ----------------------------
      // Tworzymy datę UTC
      // ----------------------------
      const eventDate = getEventDateUTC(day, month, hours, minutes);

      // ----------------------------
      // Formatujemy datę do wyświetlenia
      // ----------------------------
      const formatted = formatEventUTC(day, month, hours, minutes);

      // ----------------------------
      // Wyświetlamy podsumowanie eventu
      // ----------------------------
      await interaction.reply({
        content: `📝 Custom Event **${title}** scheduled for **${formatted}**${notify ? " (notification enabled)" : ""}\nDescription: ${description}`,
        ephemeral: true,
      });

      // ----------------------------
      // 🔹 Tutaj możemy triggerować kolejne stepy:
      // - np. submitEventStep() do zapisania eventu
      // - przypisanie typu eventu
      // - powiadomienia
      // ----------------------------
    },
  });
}