import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction } from "discord.js";

import {
  renderModeratorHub,
  renderEventsView,
  renderPointsView,
  renderAbsenceView,
  ViewResult,
} from "../views/moderator.view";

type ModeratorPayload = {
  target?: "hub" | "events" | "points" | "absence" | "quickadd" | "help";
};

// =====================================
// 🔹 REGISTER ACTIONS
// =====================================

export function registerModeratorHubActions() {
  // 🔘 OPEN PANEL / NAVIGATE
  registerUIAction("moderator.open", {
    system: "moderator",
    handler: async (
      interaction: Interaction,
      _ctx,
      payload: ModeratorPayload
    ) => {
      if (!interaction.isButton()) return;

      const target = payload?.target;

      const viewMap: Record<string, () => Promise<ViewResult>> = {
        hub: () => renderModeratorHub(),
        events: () => renderEventsView(),
        points: () => renderPointsView(),
        absence: () => renderAbsenceView(),
      };

      if (target && target in viewMap) {
        const view = await viewMap[target]();
        await interaction.update({
          content: view.content,
          components: view.components,
        });
        return;
      }

      // 🔹 QUICKADD
      if (target === "quickadd") {
        await interaction.update({
          content: "⚡ QuickAdd Panel (coming soon)",
          components: [],
        });
        return;
      }

      // 🔹 HELP
      if (target === "help") {
        const content = `
📌 **Moderator Panel Guide**

🟢 Event Menu → Create events, manage participants, cancel events.
⭐ Points Menu → Manage points and rankings.
🕒 Absence Menu → Manage absences and schedules.
⚡ QuickAdd → Fast data input system (OCR, parser).
❓ Help → Shows this description.
        `.trim();

        await interaction.update({
          content,
          components: [],
        });
        return;
      }
    },
  });
}