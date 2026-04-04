// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { Interaction, ButtonInteraction } from "discord.js";

// 🔹 Funkcja rejestrująca wszystkie akcje dla flow tworzenia eventu
export function registerEventsCreateActions() {
  // =====================================
  // START CREATE EVENT
  // =====================================
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction: Interaction) => {
      if (!interaction.isButton()) return;

      const buttonInteraction = interaction as ButtonInteraction;

      const view = eventsCreateView();
      const mutableComponents = view.components.map(row => ({
        ...row,
        components: row.components.map(btn => ({ ...btn })),
      }));

      await buttonInteraction.update({
        content: view.content,
        components: mutableComponents,
      });
    },
  });

  // =====================================
  // SELECT TYPE BUTTON
  // =====================================
  registerUIAction("events.create.selectType", {
    system: "events",
    handler: async (interaction: Interaction) => {
      if (!interaction.isButton()) return;

      const buttonInteraction = interaction as ButtonInteraction;
      const target = buttonInteraction.customId.split("target=")[1];

      if (target === "BD") {
        // Birthday form
        await buttonInteraction.client.emit("ui.router.interaction.received", {
          id: "events.create.birthdayForm",
          user: buttonInteraction.user,
          channel: buttonInteraction.channel,
          message: buttonInteraction.message,
          interaction: buttonInteraction,
        });
      } else if (target === "C") {
        // Custom event form
        await buttonInteraction.client.emit("ui.router.interaction.received", {
          id: "events.create.customEventForm",
          user: buttonInteraction.user,
          channel: buttonInteraction.channel,
          message: buttonInteraction.message,
          interaction: buttonInteraction,
        });
      } else {
        // Standard event → next step: select day
        await buttonInteraction.client.emit("ui.router.interaction.received", {
          id: "events.create.selectDay",
          user: buttonInteraction.user,
          channel: buttonInteraction.channel,
          message: buttonInteraction.message,
          interaction: buttonInteraction,
        });
      }
    },
  });

  // =====================================
  // BACK TO EVENT PANEL (z każdego step)
  // =====================================
  registerUIAction("events.create.backToMain", {
    system: "events",
    handler: async (interaction: Interaction) => {
      if (!interaction.isButton()) return;

      const buttonInteraction = interaction as ButtonInteraction;

      await buttonInteraction.client.emit("ui.router.interaction.received", {
        id: "events.main.create",
        user: buttonInteraction.user,
        channel: buttonInteraction.channel,
        message: buttonInteraction.message,
        interaction: buttonInteraction,
      });
    },
  });
}