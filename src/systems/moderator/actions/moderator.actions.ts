// =====================================
// 📁 src/systems/moderator/actions/moderator.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction } from "discord.js";
import { renderView } from "@/ui/core/uiEngine";

import {
  moderatorHubView,
  moderatorEventsView,
  moderatorPointsView,
  moderatorAbsenceView,
  moderatorHelpView,
} from "../views/moderator.view";

type ModeratorPayload = { target?: string };

// =====================================
// 🔹 REGISTER ACTIONS
// =====================================

export function registerModeratorHubActions() {
  registerUIAction("moderator.open", {
    system: "moderator",
    handler: async (interaction: Interaction, _ctx, payload: ModeratorPayload) => {
      if (!interaction.isButton()) return;

      const target = payload?.target;

      const viewMap: Record<string, () => Promise<any>> = {
        hub: () => renderView(interaction, moderatorHubView.id),
        events: () => renderView(interaction, moderatorEventsView.id),
        points: () => renderView(interaction, moderatorPointsView.id),
        absence: () => renderView(interaction, moderatorAbsenceView.id),
        help: () => renderView(interaction, moderatorHelpView.id),
      };

      const view = target && target in viewMap ? await viewMap[target]() : await renderView(interaction, moderatorHubView.id);

      await interaction.update({ content: view.content, components: view.buttons });
    },
  });
}
