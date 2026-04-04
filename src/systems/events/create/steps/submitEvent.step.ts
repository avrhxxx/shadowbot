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
      const paramsString = interaction.customId.split("|")[1] ?? "";
      const params: Record<string, string> = {};
      paramsString.split("&").forEach(part => {
        const [k, v] = part.split("=");
        if (k && v) params[k] = v;
      });

      const day = Number(params.day ?? 0);
      const month = Number(params.month ?? 0);
      const hours = Number(params.hours ?? 0);
      const minutes = Number(params.minutes ?? 0);
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