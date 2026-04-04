// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { ButtonInteraction, InteractionUpdateOptions } from "discord.js";

export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction: ButtonInteraction) => {
      if (!interaction.isButton()) return;

      const view = eventsCreateView();

      // Tworzymy mutowalną kopię komponentów dla Discord.js
      const mutableComponents: InteractionUpdateOptions["components"] = view.components.map(row => ({
        type: 1,
        components: row.components.map(btn => ({ ...btn })),
      }));

      await interaction.update({
        content: view.content,
        components: mutableComponents,
      });
    },
  });
}