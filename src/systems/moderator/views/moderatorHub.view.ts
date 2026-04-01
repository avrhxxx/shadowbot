// =====================================
// 📁 src/systems/moderator/views/moderatorHub.view.ts
// =====================================

import type { ViewResult } from "@/core/ui/uiEngine";
import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 HUB VIEW
// =====================================

export async function renderModeratorHub(): Promise<ViewResult> {
  const rows: any[] = [];

  const systems = [
    { name: "events", label: "Event Menu" },
    { name: "points", label: "Points Menu" },
    { name: "absence", label: "Absence Menu" },
    { name: "quickadd", label: "QuickAdd Menu" },
  ];

  const buttons: any[] = [];

  for (const sys of systems) {
    const enabled = await isSystemEnabled(sys.name);
    if (!enabled) continue;

    buttons.push({
      type: 2,
      label: sys.label,
      style: 1,
      custom_id: `moderator.open|target=${sys.name}`,
    });
  }

  // 🔹 HELP (zawsze)
  buttons.push({
    type: 2,
    label: "Help",
    style: 3,
    custom_id: `moderator.open|target=help`,
  });

  // 🔹 podział na rzędy (max 5)
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({
      type: 1,
      components: buttons.slice(i, i + 5),
    });
  }

  return {
    content: `📌 **Moderator Panel**\n\nSelect an option:`,
    components: rows,
  };
}