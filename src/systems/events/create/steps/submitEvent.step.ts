// =====================================
// 📁 src/systems/events/create/steps/submitEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ModalSubmitInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: SUBMIT EVENT
// ----------------------------
export function registerSubmitEventStep() {
  registerUIAction("events.create.submit", {
    system: "events",
    handler: async (interaction: ModalSubmitInteraction, ctx: TraceContext) => {
      if (!interaction.isModalSubmit()) return;

      // Pobieramy parametry z custom_id modala
      const [params] = interaction.customId.split("|").slice(1);
      const day = Number(params.split("&")[0].split("=")[1]);
      const month = Number(params.split("&")[1].split("=")[1]);

      // Pobieramy hours/minutes z modala
      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));

      // Tworzymy datę UTC
      const eventDate = getEventDateUTC(day, month, hours, minutes);

      // Formatujemy do wyświetlenia
      const formatted = formatEventUTC(day, month, hours, minutes);

      // Tutaj w praktyce tworzymy event w systemie / store
      // Dla demo wyświetlamy podsumowanie
      await interaction.reply({
        content: `✅ Event created for **${formatted}**`,
        ephemeral: true,
      });

      // W tym miejscu można też triggerować dalsze kroki,
      // np. zapis do bazy, przypisanie typu eventu, powiadomienia itd.
    },
  });
}