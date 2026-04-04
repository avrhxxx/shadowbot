// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { ButtonInteraction } from "discord.js";

export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction: ButtonInteraction) => {
      // Sprawdzamy, czy to faktycznie button interaction
      if (!interaction.isButton()) return;

      // Wyświetlamy widok eventów
      await interaction.update(eventsCreateView());
    },
  });
}