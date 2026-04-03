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
    handler: async (interaction: any) => {
      // Lazy import widoku wewnątrz handlera
      const { eventsCreateView } = await import("./eventsCreate.view");
      const view = await eventsCreateView();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}