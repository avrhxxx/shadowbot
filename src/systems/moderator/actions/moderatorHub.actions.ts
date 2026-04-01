// =====================================
// 📁 src/systems/moderator/actions/moderatorHub.actions.ts
// =====================================

import type { TraceContext } from "@/trace";
import { handleAction } from "@/core/ui/uiEngine";
import { renderEventPanel } from "../panels/eventPanel";
import { renderPointsPanel } from "../panels/pointsPanel";
import { renderAbsencePanel } from "../panels/absencePanel";
import { renderHelpPanel } from "../panels/helpPanel";

// 🔹 REGISTER ACTIONS
export function registerModeratorHubActions() {
  handleAction("moderator.openEventMenu", async (ctx: TraceContext, state?: any) => {
    return { type: "view", view: "moderator.eventPanel" };
  });

  handleAction("moderator.openPointsMenu", async (ctx: TraceContext, state?: any) => {
    return { type: "view", view: "moderator.pointsPanel" };
  });

  handleAction("moderator.openAbsenceMenu", async (ctx: TraceContext, state?: any) => {
    return { type: "view", view: "moderator.absencePanel" };
  });

  handleAction("moderator.openHelpMenu", async (ctx: TraceContext, state?: any) => {
    return { type: "view", view: "moderator.helpPanel" };
  });
}