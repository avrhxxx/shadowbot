// =====================================
// 📁 src/systems/moderator/views/moderatorHub.view.ts
// =====================================

import { SYSTEM_REGISTRY } from "@/runtime/runtimeRegistry";
import { isSystemEnabled } from "@/runtime/runtimeState";
import type { ViewResult } from "@/core/ui/uiEngine";

// =====================================
// 🔹 HUB VIEW
// =====================================

export async function renderModeratorHub(): Promise<ViewResult> {
  const lines: string[] = [];
  const buttons: any[] = [];

  // 🔹 Lista głównych systemów dla moderatora
  const systems = [
    { name: "event", label: "Event Menu", action: "moderator.openEventMenu" },
    { name: "points", label: "Points Menu", action: "moderator.openPointsMenu" },
    { name: "absence", label: "Absence Menu", action: "moderator.openAbsenceMenu" },
    { name: "translate", label: "Translate Menu", action: "moderator.openTranslateMenu" },
    { name: "help", label: "Help", action: "moderator.openHelpMenu" },
  ];

  for (const sys of systems) {
    // Sprawdzenie czy system włączony (oprócz help, który zawsze dostępny)
    const enabled = sys.name === "help" ? true : await isSystemEnabled(sys.name);
    const status = enabled ? "🟢 ON" : "🔴 OFF";

    lines.push(`**${sys.label}** → ${status}`);

    buttons.push({
      type: 2, // button
      label: sys.label,
      style: enabled ? 1 : 2, // 1 = Primary, 2 = Secondary
      custom_id: sys.action,
      disabled: !enabled,
    });
  }

  return {
    content: `📌 **Moderator Panel**\n\nSelect an option:\n\n${lines.join("\n")}`,
    components: [
      {
        type: 1, // action row
        components: buttons,
      },
    ],
  };
}