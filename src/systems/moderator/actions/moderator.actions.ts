// =====================================
// 📁 src/systems/moderator/actions/moderator.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { renderView } from "@/ui/core/uiEngine";

import {
  moderatorHubView,
  moderatorEventsView,
  moderatorPointsView,
  moderatorAbsenceView,
  moderatorHelpView,
} from "../views/moderator.view";

type ModeratorPayload = { target?: string };

// 🔹 Minimalny TraceContext do renderView
const createMinimalTraceContext = () => ({
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
    handler: async (interaction: any, _ctx, payload: ModeratorPayload) => {
      try {
        // Sprawdzenie, czy przychodzi właściwy typ akcji
        if (!interaction.isButton?.()) return;

        const target = payload?.target;

        // Mapa widoków powiązana z identyfikatorami z views
        const viewMap: Record<string, () => Promise<{ content: string; components: any[] }>> = {
          hub: () => renderView(createMinimalTraceContext(), moderatorHubView.id),
          events: () => renderView(createMinimalTraceContext(), moderatorEventsView.id),
          points: () => renderView(createMinimalTraceContext(), moderatorPointsView.id),
          absence: () => renderView(createMinimalTraceContext(), moderatorAbsenceView.id),
          help: () => renderView(createMinimalTraceContext(), moderatorHelpView.id),
        };

        // Pobranie widoku docelowego lub domyślnego (hub)
        const view = target && target in viewMap
          ? await viewMap[target]()
          : await renderView(createMinimalTraceContext(), moderatorHubView.id);

        // Aktualizacja UI przez silnik
        await interaction.update({
          content: view.content,
          components: view.components,
        });
      } catch (err) {
        // 🔹 Centralny fallback error
        console.error("Moderator action failed:", err);
        await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
      }
    },
  });
}