import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { Interaction } from "discord.js";

export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction: Interaction) => {
      // Sprawdzamy, czy mamy button interaction
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