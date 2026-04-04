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
      // Sprawdzamy, czy to faktycznie button
      if (!interaction.isButton()) return;

      // Aktualizacja UI przyciskiem (update działa tylko dla ButtonInteraction)
      await interaction.update({
        content: eventsCreateView().content,
        components: eventsCreateView().components,
      });
    },
  });
}