// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { eventsCreateView } from "./eventsCreate.view";
import { StepsMap } from "./steps";

// 🔹 Typ kontekstu UI z potrzebnymi metodami
interface UIContext {
  renderView: (view: any, payload?: any) => Promise<void>;
  showModal: (modal: any, payload?: any) => Promise<void>;
  navigate: (destination: string, options?: Record<string, any>) => Promise<void>;
}

/**
 * 🔹 Rejestruje wszystkie akcje flow tworzenia eventu
 */
export function registerEventsCreateActions() {
  // =====================================
  // START CREATE EVENT
  // =====================================
  registerUIAction("events.create.start", {
    system: "events",
    handler: async (ctx: UIContext) => {
      const view = eventsCreateView();
      await ctx.renderView(view);
    },
  });

  // =====================================
  // SELECT TYPE BUTTON (BD = Birthday, C = Custom, else = normal day select)
  // =====================================
  registerUIAction("events.create.selectType", {
    system: "events",
    handler: async (ctx: UIContext, _unused, payload: any) => {
      const target = payload?.target;
      let nextStepId: keyof typeof StepsMap;

      if (target === "BD") nextStepId = "birthdayForm";
      else if (target === "C") nextStepId = "customEventForm";
      else nextStepId = "selectDay";

      const stepEntry = StepsMap[nextStepId];
      if (!stepEntry || !stepEntry.view) return;

      if (nextStepId === "customEventForm" || nextStepId === "birthdayForm") {
        await ctx.showModal(stepEntry.view(payload), payload);
      } else {
        const view = stepEntry.view(payload);
        await ctx.renderView(view, payload);
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
      handler: async (ctx: UIContext, _unused, payload: any) => {
        if (key === "birthdayForm" || key === "customEventForm") {
          await ctx.showModal(stepEntry.view(payload), payload);
        } else {
          const view = stepEntry.view(payload);
          await ctx.renderView(view, payload);
        }
      },
    });
  }

  // =====================================
  // BACK TO EVENT PANEL (z każdego step)
  // =====================================
  registerUIAction("events.create.backToMain", {
    system: "events",
    handler: async (ctx: UIContext, _unused, payload: any) => {
      await ctx.navigate("events.main.create", {
        user: payload?.user,
        channel: payload?.channel,
        message: payload?.message,
      });
    },
  });
}