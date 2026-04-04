// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { StepsMap } from "./steps";
import { Interaction, ButtonInteraction } from "discord.js";

/**
 * 🔹 Funkcja rejestrująca wszystkie akcje dla flow tworzenia eventu
 * Plik: src/systems/events/create/eventsCreate.action.ts
 */
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

      let nextStepId: keyof typeof StepsMap;
      if (target === "BD") nextStepId = "birthdayForm";
      else if (target === "C") nextStepId = "customEventForm";
      else nextStepId = "selectDay";

      const stepEntry = StepsMap[nextStepId];

      if (nextStepId === "customEventForm") {
        // 🔹 Dla modali wywołujemy showModal
        if (stepEntry.view) {
          await buttonInteraction.showModal(stepEntry.view());
        }
      } else {
        // 🔹 Dla zwykłych widoków
        if (stepEntry.view) {
          const view = stepEntry.view();
          await buttonInteraction.update({
            content: view.content,
            components: view.components,
          });
        }
      }
    },
  });

  // =====================================
  // STEPS MAP AUTOMATYCZNE (TYLKO TE, KTÓRE MAJĄ VIEW BEZ PARAMETRÓW)
  // =====================================
  for (const [key, stepEntry] of Object.entries(StepsMap)) {
    if (!stepEntry.view) continue; // brak widoku do automatycznego update (np. modal lub view z parametrami)
    if (key === "confirmEvent") continue; // wymaga parametrów – wywoływane ręcznie po wyborze czasu

    const actionId = `events.create.${key}`;
    registerUIAction(actionId, {
      system: "events",
      handler: async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        const buttonInteraction = interaction as ButtonInteraction;

        const view = stepEntry.view();
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