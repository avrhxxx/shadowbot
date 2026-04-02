// =====================================
// 📁 src/systems/moderator/actions/moderator.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { isSystemEnabled } from "@/runtime/runtimeState";

// 🔹 IMPORT VIEWS
import { renderModeratorHub } from "@/systems/moderator/views/moderator.view";
import { renderEventsView } from "@/systems/events/views/events.view";
import { renderPointsView } from "@/systems/points/views/points.view";
import { renderAbsenceView } from "@/systems/absence/views/absence.view";

type ModeratorPayload = {
  target?: "hub" | "events" | "points" | "absence" | "quickadd" | "help";
};

// =====================================
// 🔹 REGISTER ACTIONS
// =====================================

export function registerModeratorActions() {
  // 🔹 OPEN PANEL / SUBPANELS
  registerUIAction("moderator.open", {
    system: "moderator",

    handler: async (interaction, _ctx, payload: ModeratorPayload) => {
      if (!interaction.isButton()) return;

      const target = payload?.target;

      // 🔹 VIEW MAP
      const viewMap: Record<string, () => Promise<any>> = {
        hub: () => renderModeratorHub(),
        events: () => renderEventsView(),
        points: () => renderPointsView(),
        absence: () => renderAbsenceView(),
      };

      // 🔹 HANDLE TARGETS
      if (target && target in viewMap) {
        const view = await viewMap[target]();

        await interaction.update({
          content: view.content,
          components: view.components,
        });

        return;
      }

      // 🔹 QUICKADD (placeholder)
      if (target === "quickadd") {
        await interaction.update({
          content: "⚡ QuickAdd Panel (coming soon)",
          components: [],
        });
        return;
      }

      // 🔹 HELP (plain view)
      if (target === "help") {
        const helpContent = `
📌 **Moderator Panel Guide**

🟢 Event Menu → Create events, manage participants, cancel events.
⭐ Points Menu → Manage points and rankings.
🕒 Absence Menu → Manage absences and schedules.
⚡ QuickAdd → Fast data input system (OCR, parser).
❓ Help → Shows this description.
        `;

        await interaction.update({
          content: helpContent,
          components: [],
        });
      }
    },
  });
}