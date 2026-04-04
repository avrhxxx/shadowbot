// =====================================
// 📁 src/systems/events/create/steps/submitEvent.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";
import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

export function registerSubmitEventStep() {
  registerUIAction("events.create.submit", {
    system: "events",
    handler: async (interaction: ButtonInteraction | ModalSubmitInteraction) => {
      // Akceptujemy tylko button lub modal submit
      if (!interaction.isButton() && !interaction.isModalSubmit()) return;

      // Pobieramy parametry z custom_id
      const paramsString = interaction.customId.split("|")[1] || "";
      const params = paramsString.split("&").reduce<Record<string, string>>((acc, cur) => {
        const [k, v] = cur.split("=");
        acc[k] = v;
        return acc;
      }, {});

      const day = Number(params.day);
      const month = Number(params.month);
      const hours = Number(params.hours);
      const minutes = Number(params.minutes);
      const notify = params.notify === "true";

      const formatted = formatEventUTC(day, month, hours, minutes);

      // Podsumowanie eventu
      await interaction.reply({
        content: `✅ Event created for **${formatted}**${notify ? " (notification sent)" : ""}`,
        ephemeral: true,
      });
    },
  });
}