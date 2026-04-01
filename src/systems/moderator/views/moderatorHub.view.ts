// =====================================
// 📁 src/systems/moderator/views/moderatorHub.view.ts
// =====================================

import type { ViewResult } from "@/core/ui/uiEngine";
import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 HUB VIEW
// =====================================

export async function renderModeratorHub(): Promise<ViewResult> {
  const buttons: any[] = [];

  // 🔹 Lista systemów dla moderatora
  const systems = [
    { name: "event", label: "Event Menu", action: "moderator.openEventMenu" },
    { name: "points", label: "Points Menu", action: "moderator.openPointsMenu" },
    { name: "absence", label: "Absence Menu", action: "moderator.openAbsenceMenu" },
    { name: "quickadd", label: "QuickAdd Menu", action: "moderator.openQuickAddMenu" },
    { name: "help", label: "Help", action: "moderator.openHelpMenu" },
  ];

  for (const sys of systems) {
    const enabled = sys.name === "help" ? true : await isSystemEnabled(sys.name);

    buttons.push({
      type: 2, // button
      label: sys.label,
      style: sys.name === "help" ? 3 : 1, // Help = Success, reszta Primary
      custom_id: sys.action,
      disabled: !enabled, // wyłączony jeśli system nieaktywny
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