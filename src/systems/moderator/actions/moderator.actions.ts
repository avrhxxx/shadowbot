// =====================================
// 📁 src/systems/moderator/actions/moderator.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction, ButtonInteraction } from "discord.js";
import { renderView, TraceContext } from "@/ui/core/uiEngine";

import {
  moderatorHubView,
  moderatorEventsView,
  moderatorPointsView,
  moderatorAbsenceView,
  moderatorHelpView,
} from "../views/moderator.view";

type ModeratorPayload = { target?: string };

// 🔹 minimalny TraceContext do renderView
const createMinimalTraceContext = (): TraceContext => ({
  traceId: { __brand: "TraceId" } as any,
  correlationId: { __brand: "CorrelationId" } as any,
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

      const btnInteraction = interaction as ButtonInteraction;
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

      await btnInteraction.update({
        content: view.content,
        components: view.components, // wcześniej było view.buttons
      });
    },
  });
}