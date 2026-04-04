// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import {
  selectDayView,
  birthdayFormView,
  customEventFormView,
  confirmEventView,
} from "./steps";
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

      let nextStepId: string;
      if (target === "BD") nextStepId = "events.create.birthdayForm";
      else if (target === "C") nextStepId = "events.create.customEventForm";
      else nextStepId = "events.create.selectDay";

      await buttonInteraction.client.emit("ui.router.interaction.received", {
        id: nextStepId,
        user: buttonInteraction.user,
        channel: buttonInteraction.channel,
        message: buttonInteraction.message,
        interaction: buttonInteraction,
      });
    },
  });

  // =====================================
  // STEPS
  // =====================================
  const steps = {
    "events.create.selectDay": selectDayView,
    "events.create.birthdayForm": birthdayFormView,
    "events.create.customEventForm": customEventFormView,
    "events.create.confirmEvent": confirmEventView,
  } as const;

  for (const [actionId, viewFn] of Object.entries(steps)) {
    registerUIAction(actionId, {
      system: "events",
      handler: async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        const buttonInteraction = interaction as ButtonInteraction;

        const view = viewFn();
        await buttonInteraction.update({
          content: view.content,
          components: view.components,
        });
      },
    });
  }

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