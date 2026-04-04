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
      const view = eventsCreateView()(ctx);
      await ctx.renderView("events.create", view);
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

      if (!stepEntry) return;

      if (nextStepId === "customEventForm" && stepEntry.view) {
        // 🔹 Modal
        await ctx.showModal(stepEntry.view()(ctx));
      } else if (stepEntry.view) {
        // 🔹 Zwykły widok
        const view = stepEntry.view()(ctx);
        await ctx.renderView(stepEntry.id, view);
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
        const view = stepEntry.view()(ctx);
        await ctx.renderView(stepEntry.id, view);
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