// =====================================
// 📁 src/systems/events/create/steps/selectDay.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import type { ButtonInteraction } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";

// ----------------------------
// REGISTER STEP: SELECT DAY
// ----------------------------
export function registerSelectDayStep() {
  registerUIAction("events.create.selectDay", {
    system: "events",
    handler: async (interaction: ButtonInteraction, ctx: TraceContext) => {
      if (!interaction.isButton()) return;

      // 🔹 Lazy import widoku
      const { selectDayStepView } = await import("./selectDay.step.view");
      const view = await selectDayStepView();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}