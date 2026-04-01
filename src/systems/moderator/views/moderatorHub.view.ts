// =====================================
// 📁 src/systems/moderator/views/moderatorHub.view.ts
// =====================================

import { isSystemEnabled } from "@/runtime/runtimeState";
import type { ViewResult } from "@/core/ui/uiEngine";

// =====================================
// 🔹 HUB VIEW
// =====================================

export async function renderModeratorHub(): Promise<ViewResult> {
  const buttons: any[] = [];

  // 🔹 Lista głównych systemów dla moderatora
  const systems = [
    { name: "event", label: "Event Menu", action: "moderator.openEventMenu" },
    { name: "points", label: "Points Menu", action: "moderator.openPointsMenu" },
    { name: "absence", label: "Absence Menu", action: "moderator.openAbsenceMenu" },
    { name: "quickadd", label: "QuickAdd Menu", action: "moderator.openQuickAddMenu" },
    { name: "help", label: "Help", action: "moderator.openHelpMenu" },
  ];

  for (const sys of systems) {
    // Help zawsze dostępny
    const enabled = sys.name === "help" ? true : await isSystemEnabled(sys.name);

    buttons.push({
      type: 2, // button
      label: sys.label,
      style: sys.name === "help" ? 3 : 1, // Help = Success (3), reszta Primary (1)
      custom_id: sys.action,
      disabled: !enabled,
    });
  }

  return {
    content: `📌 **Moderator Panel**\n\nSelect an option:`,
    components: [
      {
        type: 1, // Action Row
        components: buttons,
      },
    ],
  };
}