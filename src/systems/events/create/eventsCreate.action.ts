// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { ButtonInteraction, Interaction } from "discord.js";

export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction: Interaction) => {
      // 🔹 Akceptujemy tylko ButtonInteraction
      if (!interaction.isButton()) return;

      const buttonInteraction = interaction as ButtonInteraction;

      // Discord.js wymaga mutowalnej tablicy komponentów
      const view = eventsCreateView();
      const mutableComponents = view.components.map(row => ({
        ...row,
        components: row.components.map(btn => ({ ...btn })),
      }));

      await buttonInteraction.update({
        content: view.content,
        components: mutableComponents,
      });

      console.log("✅ Create Event button clicked by", interaction.user.id);
    },
  });
}