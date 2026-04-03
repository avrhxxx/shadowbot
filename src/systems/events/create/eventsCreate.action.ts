// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ButtonInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";

// ----------------------------
// REGISTER MAIN CREATE BUTTON
// ----------------------------
export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction: ButtonInteraction, ctx: TraceContext) => {
      if (!interaction.isButton()) return;

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