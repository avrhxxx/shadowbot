// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { StepsMap } from "./steps";

/**
 * 🔹 Funkcja rejestrująca wszystkie akcje dla flow tworzenia eventu
 */
export function registerEventsCreateActions() {
  // =====================================
  // START CREATE EVENT
  // =====================================
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (interaction) => {
      const view = eventsCreateView();
      const mutableComponents = view.components.map(row => ({
        ...row,
        components: row.components.map(btn => ({ ...btn })),
      }));

      await interaction.update?.({
        content: view.content,
        components: mutableComponents,
      });
    },
  });

  // =====================================
  // SELECT TYPE BUTTON (BD = Birthday, C = Custom, else = normal day select)
  // =====================================
  registerUIAction("events.create.selectType", {
    system: "events",
    handler: async (interaction, ctx, payload) => {
      const target = payload?.target;
      let nextStepId: keyof typeof StepsMap;

      if (target === "BD") nextStepId = "birthdayForm";
      else if (target === "C") nextStepId = "customEventForm";
      else nextStepId = "selectDay";

      const stepEntry = StepsMap[nextStepId];

      // 🔹 Modale (customEventForm) używamy showModal
      if (nextStepId === "customEventForm" && stepEntry.view) {
        await interaction.showModal?.(stepEntry.view());
      } else if (stepEntry.view) {
        // 🔹 Zwykłe widoki
        const view = stepEntry.view();
        await interaction.update?.({
          content: view.content,
          components: view.components,
        });
      }
    },
  });

  // =====================================
  // AUTOMATYCZNE REJESTROWANIE KROKÓW (TYLKO TE, KTÓRE MAJĄ VIEW BEZ PARAMETRÓW)
  // =====================================
  for (const [key, stepEntry] of Object.entries(StepsMap)) {
    if (!stepEntry.view) continue;
    if (key === "confirmEvent") continue; // wymaga parametrów – wywoływane ręcznie

    const actionId = `events.create.${key}`;
    registerUIAction(actionId, {
      system: "events",
      handler: async (interaction) => {
        const view = stepEntry.view();
        await interaction.update?.({
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
    handler: async (interaction) => {
      await interaction.client.emit("ui.router.interaction.received", {
        id: "events.main.create",
        user: payload?.user || interaction.user,
        channel: payload?.channel || interaction.channel,
        message: payload?.message || interaction.message,
        interaction,
      });
    },
  });
}