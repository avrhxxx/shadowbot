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

      // Discord.js wymaga mutowalnej tablicy, więc kopiujemy components
      const view = eventsCreateView();
      const mutableComponents = view.components.map(row => ({
        ...row,
        components: row.components.map(btn => ({ ...btn }))
      }));

      await interaction.update({
        content: view.content,
        components: mutableComponents,
      });
    },
  });
}