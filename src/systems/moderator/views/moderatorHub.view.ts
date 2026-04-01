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
  ];

  // 🔹 Generujemy tylko włączone systemy
  for (const sys of systems) {
    const enabled = await isSystemEnabled(sys.name);
    if (!enabled) continue; // pomijamy jeśli system wyłączony

    buttons.push({
      type: 2, // button
      label: sys.label,
      style: 1, // Primary
      custom_id: sys.action,
      disabled: false,
    });
  }

  // 🔹 Dodajemy zawsze dostępny przycisk Help
  buttons.push({
    type: 2,
    label: "Help",
    style: 3, // Success
    custom_id: "moderator.openHelpMenu",
    disabled: false,
  });

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