// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { StepsMap } from "./steps";

/**
 * 🔹 Rejestruje wszystkie akcje flow tworzenia eventu
 */
export function registerEventsCreateActions() {
  // =====================================
  // START CREATE EVENT
  // =====================================
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (ctx) => {
      const view = eventsCreateView();
      await ctx.renderView(view);
    },
  });

  // =====================================
  // SELECT TYPE BUTTON (BD = Birthday, C = Custom, else = normal day select)
  // =====================================
  registerUIAction("events.create.selectType", {
    system: "events",
    handler: async (ctx, _unused, payload) => {
      const target = payload?.target;
      let nextStepId: keyof typeof StepsMap;

      if (target === "BD") nextStepId = "birthdayForm";
      else if (target === "C") nextStepId = "customEventForm";
      else nextStepId = "selectDay";

      const stepEntry = StepsMap[nextStepId];
      if (!stepEntry || !stepEntry.view) return;

      // 🔹 Modal
      if (nextStepId === "customEventForm" || nextStepId === "birthdayForm") {
        await ctx.showModal(stepEntry.view());
      } else {
        // 🔹 Zwykły widok
        const view = stepEntry.view();
        await ctx.renderView(view);
      }
    },
  });

  // =====================================
  // AUTOMATYCZNE REJESTROWANIE KROKÓW (TYLKO TE, KTÓRE MAJĄ VIEW BEZ PARAMETRÓW)
  // =====================================
  for (const [key, stepEntry] of Object.entries(StepsMap)) {
    if (!stepEntry.view) continue;
    if (key === "confirmEvent") continue; // wymaga parametrów

    const actionId = `events.create.${key}`;
    registerUIAction(actionId, {
      system: "events",
      handler: async (ctx) => {
        // 🔹 Jeśli krok jest modalem
        if (key === "birthdayForm" || key === "customEventForm") {
          await ctx.showModal(stepEntry.view());
        } else {
          const view = stepEntry.view();
          await ctx.renderView(view);
        }
      },
    });
  }

  // =====================================
  // BACK TO EVENT PANEL (z każdego step)
  // =====================================
  registerUIAction("events.create.backToMain", {
    system: "events",
    handler: async (ctx, _unused, payload) => {
      await ctx.navigate("events.main.create", {
        user: payload?.user,
        channel: payload?.channel,
        message: payload?.message,
      });
    },
  });
}