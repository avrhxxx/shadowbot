
// src/systems/events/views/events.main.view.ts
import { ViewResult } from "@/systems/moderator/views/moderator.view";

// =====================================
// 🧠 EVENTS MAIN VIEW
// =====================================

export async function renderEventsMain(): Promise<ViewResult> {
  const buttons: any[] = [];

  const actions = [
    { action: "create", label: "Create Event", style: 1 },           // Primary
    { action: "list", label: "Events List", style: 1 },             // Primary
    { action: "manualReminder", label: "Manual Reminder", style: 1 }, // Primary
    { action: "showAll", label: "Show All", style: 1 },             // Primary
    { action: "cancel", label: "Cancel Event", style: 4 },          // Danger
    { action: "settings", label: "Settings", style: 2 },            // Secondary
    { action: "help", label: "Guide", style: 3 },                   // Success
  ];

  for (const act of actions) {
    buttons.push({
      type: 2,
      label: act.label,
      style: act.style,
      custom_id: `events.main|action=${act.action}`, // flow-based
    });
  }

  // 🔹 BACK BUTTON do moderator hub
  buttons.push({
    type: 2,
    label: "Back",
    style: 2, // Secondary
    custom_id: `events.main|action=back`,
  });

  // 🔹 Podział na rzędy max 5 przycisków
  const rows: any[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }

  return {
    content: `📌 **Event Panel**\n\nSelect an option:`,
    components: rows,
  };
}