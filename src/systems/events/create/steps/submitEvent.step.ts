// =====================================
// 📁 src/systems/events/create/steps/submitEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// ----------------------------
// REGISTER STEP: SUBMIT EVENT (LOGIC + UI)
// ----------------------------
export function registerSubmitEventStep() {
  registerUIAction("events.create.submit", {
    system: "events",
    handler: async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;

      const [params] = interaction.customId.split("|").slice(1);
      const day = Number(params.split("&")[0].split("=")[1]);
      const month = Number(params.split("&")[1].split("=")[1]);
      const hours = Number(params.split("&")[2].split("=")[1]);
      const minutes = Number(params.split("&")[3].split("=")[1]);
      const notify = params.includes("notify=true"); // sprawdzamy notify

      const formatted = formatEventUTC(day, month, hours, minutes);

      // Demo podsumowanie
      await interaction.reply({
        content: `✅ Event created for **${formatted}**${notify ? " (notification sent)" : ""}`,
        ephemeral: true,
      });

      // 🔹 Tutaj można triggerować dalsze akcje:
      // - zapis do store / bazy
      // - wywołanie powiadomień
      // - przypisanie typu eventu
    },
  });
}