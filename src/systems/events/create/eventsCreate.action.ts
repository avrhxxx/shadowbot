// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

// ----------------------------
// REGISTER MAIN CREATE BUTTON
// ----------------------------
export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction) => {
      // Sprawdzenie przycisku nie jest obowiązkowe, bo flow UIAction jest już filtrowany
      // if (!interaction.isButton()) return;

      // Lazy import widoku
      const { eventsCreateView } = await import("./eventsCreate.view");
      const view = await eventsCreateView();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}