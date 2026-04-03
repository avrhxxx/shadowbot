// src/systems/events/create/eventsCreate.action.ts

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";

export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async () => {
      return eventsCreateView();
    },
  });
}