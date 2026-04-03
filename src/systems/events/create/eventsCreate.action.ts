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
      // Lazy import widoku bezpośrednio w handlerze
      const { eventsCreateView } = await import("./eventsCreate.view");
      const view = await eventsCreateView();

      // Zwracamy zawartość jako odpowiedź UIAction
      return {
        content: view.content,
        components: view.components,
      };
    },
  });
}