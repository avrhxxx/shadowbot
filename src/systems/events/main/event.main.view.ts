// =====================================
// 📁 src/systems/events/main/event.main.view.ts
// =====================================

import { isSystemEnabled } from "@/runtime/runtimeState";
import { ViewResult } from "@/core/ui/uiEngine";

export async function eventMainView(): Promise<ViewResult> {
  const buttons: any[] = [];

  const systems = [
    { name: "create", label: "Create Event" },
    { name: "list", label: "Events List" },
    { name: "manualReminder", label: "Manual Reminder" },
    { name: "showAll", label: "Show All" },
    { name: "cancel", label: "Cancel Event" },
  ];

  for (const sys of systems) {
    const enabled = await isSystemEnabled("events"); // możemy filtrować wg global switcha events
    if (!enabled) continue;

    buttons.push({
      type: 2,
      label: sys.label,
      style: 1, // Primary
      custom_id: `events.main|target=${sys.name}`,
    });
  }

  // 🔹 Help & Settings
  buttons.push(
    {
      type: 2,
      label: "Guide",
      style: 2, // Secondary
      custom_id: `events.main|target=help`,
    },
    {
      type: 2,
      label: "Settings",
      style: 2,
      custom_id: `events.main|target=settings`,
    }
  );

  // 🔹 podział na rzędy po 5
  const rows: any[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }

  return {
    content: `📌 **Event Panel**\n\nSelect an option:`,
    components: rows,
  };
}