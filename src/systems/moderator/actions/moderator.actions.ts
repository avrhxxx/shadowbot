// =====================================
// 📁 src/systems/moderator/actions/moderator.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction, ButtonInteraction } from "discord.js";
import { renderView } from "@/ui/core/uiEngine";

import {
  moderatorHubView,
  moderatorEventsView,
  moderatorPointsView,
  moderatorAbsenceView,
  moderatorHelpView,
} from "../views/moderator.view";

type ModeratorPayload = { target?: string };

// 🔹 minimalny TraceContext do renderView
const createMinimalTraceContext = () => ({
  traceId: "trace-" + Date.now(),
  correlationId: "correlation-" + Date.now(),
  source: "moderator.actions",
});

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
        hub: () => renderView(createMinimalTraceContext(), moderatorHubView.id),
        events: () => renderView(createMinimalTraceContext(), moderatorEventsView.id),
        points: () => renderView(createMinimalTraceContext(), moderatorPointsView.id),
        absence: () => renderView(createMinimalTraceContext(), moderatorAbsenceView.id),
        help: () => renderView(createMinimalTraceContext(), moderatorHelpView.id),
      };

      const view = target && target in viewMap
        ? await viewMap[target]()
        : await renderView(createMinimalTraceContext(), moderatorHubView.id);

      await (interaction as ButtonInteraction).update({
        content: view.content,
        components: view.components,
      });
    },
  });
}