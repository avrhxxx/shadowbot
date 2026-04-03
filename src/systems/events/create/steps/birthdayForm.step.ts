// =====================================
// 📁 src/systems/events/create/steps/birthdayForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { getEventDateUTC, formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: BIRTHDAY FORM
// Logika i UI w jednym pliku stepu
// ----------------------------
export function registerBirthdayFormStep() {
  registerUIAction("events.create.birthdayForm.submit", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      // ----------------------------
      // Pobieramy dane z formularza
      // ----------------------------
      const day = Number(interaction.fields.getTextInputValue("day"));
      const month = Number(interaction.fields.getTextInputValue("month"));
      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));
      const name = interaction.fields.getTextInputValue("name");
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
      // Wyświetlamy podsumowanie
      // ----------------------------
      await interaction.reply({
        content: `🎉 Birthday Event for **${name}** set on **${formatted}**${notify ? " (notification enabled)" : ""}`,
        ephemeral: true,
      });

      // ----------------------------
      // 🔹 Tu można w przyszłości triggerować kolejne stepy
      // np. registerConfirmEventStep() albo zapis do store
      // ----------------------------
    },
  });
}