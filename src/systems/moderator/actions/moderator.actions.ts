// =====================================
// 📁 src/systems/moderator/actions/moderator.actions.ts
// =====================================

import { interaction, view } from "@/ui/api";

import {
  moderatorHubView,
  moderatorEventsView,
  moderatorPointsView,
  moderatorAbsenceView,
  moderatorHelpView,
} from "../views/moderator.view";

type ModeratorPayload = { target?: string };

// 🔹 Mapa widoków powiązana z targetami
const viewMap: Record<string, () => Promise<{ content: string; buttons: any[] }>> = {
  hub: () => moderatorHubView.render(),
  events: () => moderatorEventsView.render(),
  points: () => moderatorPointsView.render(),
  absence: () => moderatorAbsenceView.render(),
  help: () => moderatorHelpView.render(),
};

// =====================================
// 🔹 REGISTER ACTIONS
// =====================================

export function registerModeratorHubActions() {
  interaction.handle("moderator.open", async (ctx, payload: ModeratorPayload) => {
    const target = payload?.target;

    try {
      const renderFn = target && target in viewMap ? viewMap[target] : viewMap["hub"];
      const viewData = await renderFn();

      // Aktualizacja widoku przez UI API
      await view.update(viewData);
    } catch (err) {
      console.error("Moderator action failed:", err);

      await view.followUp({
        content: "⚠️ Something went wrong.",
        ephemeral: true,
      });
    }
  });
}