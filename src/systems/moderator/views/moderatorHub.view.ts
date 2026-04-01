// =====================================
// 📁 src/systems/moderator/views/moderatorHub.view.ts
// =====================================

import type { TraceContext } from "@/trace";
import type { ViewResult } from "@/core/ui/uiEngine";

// =====================================
// 🔹 HUB VIEW
// =====================================

export function renderModeratorHub(): ViewResult {
  return {
    content: "📌 **Moderator Panel**\n\nSelect an option:",

    buttons: [
      {
        label: "Event Menu",
        action: "moderator.openEventMenu",
        style: "primary",
      },
      {
        label: "Points Menu",
        action: "moderator.openPointsMenu",
        style: "primary",
      },
      {
        label: "Absence Menu",
        action: "moderator.openAbsenceMenu",
        style: "primary",
      },
      {
        label: "Translate Menu",
        action: "moderator.openTranslateMenu",
        style: "primary",
      },
      {
        label: "Help",
        action: "moderator.openHelpMenu",
        style: "success",
      },
    ],
  };
}