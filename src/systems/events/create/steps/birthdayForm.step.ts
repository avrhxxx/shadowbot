// =====================================
// 📁 src/systems/events/create/steps/birthdayForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ModalSubmitInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: BIRTHDAY FORM (LOGIC HANDLER)
// ----------------------------
export function registerBirthdayFormStep() {
  registerUIAction("events.create.birthdayForm.submit", {
    system: "events",
    handler: async (interaction: ModalSubmitInteraction, ctx: TraceContext) => {
      if (!interaction.isModalSubmit()) return;

      // Pobieramy wartości z modala
      const day = Number(interaction.fields.getTextInputValue("day"));
      const month = Number(interaction.fields.getTextInputValue("month"));
      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));
      const name = interaction.fields.getTextInputValue("name");
      const notify = interaction.fields.getTextInputValue("notify") === "yes";

      // Tworzymy datę UTC
      const eventDate = getEventDateUTC(day, month, hours, minutes);

      // Formatujemy do wyświetlenia
      const formatted = formatEventUTC(day, month, hours, minutes);

      // Podsumowanie (demo / placeholder)
      await interaction.reply({
        content: `🎉 Birthday Event for **${name}** set on **${formatted}**${notify ? " (notification enabled)" : ""}`,
        ephemeral: true,
      });

      // Tu można dodać dalsze akcje:
      // - zapis do store / bazy
      // - wywołanie powiadomień
      // - przypisanie typu eventu
    },
  });
}