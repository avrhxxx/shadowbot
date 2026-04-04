// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { ButtonInteraction, Interaction } from "discord.js";

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
    handler: async (interaction: ButtonInteraction) => {
      if (!interaction.isButton()) return;

      const target = interaction.customId.split("target=")[1];

      if (target === "BD") {
        // Birthday form
        await interaction.client.emit("ui.router.interaction.received", {
          id: "events.create.birthdayForm",
          user: interaction.user,
          channel: interaction.channel,
          message: interaction.message,
          interaction,
        });
      } else if (target === "C") {
        // Custom event form
        await interaction.client.emit("ui.router.interaction.received", {
          id: "events.create.customEventForm",
          user: interaction.user,
          channel: interaction.channel,
          message: interaction.message,
          interaction,
        });
      } else {
        // Standard event → next step: select day
        await interaction.client.emit("ui.router.interaction.received", {
          id: "events.create.selectDay",
          user: interaction.user,
          channel: interaction.channel,
          message: interaction.message,
          interaction,
        });
      }
    },
  });

  // =====================================
  // BACK TO EVENT PANEL (z każdego step)
  // =====================================
  registerUIAction("events.create.backToMain", {
    system: "events",
    handler: async (interaction: ButtonInteraction) => {
      if (!interaction.isButton()) return;

      await interaction.client.emit("ui.router.interaction.received", {
        id: "events.main.create",
        user: interaction.user,
        channel: interaction.channel,
        message: interaction.message,
        interaction,
      });
    },
  });
}