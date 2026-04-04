// =====================================
// 📁 src/systems/events/main/event.main.view.ts
// =====================================

import { ViewResult } from "@/core/ui/uiEngine";

export async function eventMainView(): Promise<ViewResult> {
  // 🔹 wszystkie przyciski Event Panel (nie filtrowane)
  const buttons = [
    { name: "create", label: "Create Event" },
    { name: "list", label: "Events List" },
    { name: "manualReminder", label: "Manual Reminder" },
    { name: "showAll", label: "Show All" },
    { name: "cancel", label: "Cancel Event" },
    { name: "help", label: "Guide" },
    { name: "settings", label: "Settings" },
  ];

  // 🔹 mapowanie na Discord components
  const rows: any[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({
      type: 1,
      components: buttons.slice(i, i + 5).map((btn) => ({
        type: 2,
        label: btn.label,
        style: 2, // Secondary dla wszystkich przycisków
        custom_id: `events.main|target=${btn.name}`,
      })),
    });
  }

  // 🔹 dodaj rząd "Back" do moderator hub
  rows.push({
    type: 1,
    components: [
      {
        type: 2,
        label: "⬅ Back",
        style: 2, // Secondary
        custom_id: "moderator.open|target=hub",
      },
    ],
  });

  return {
    content: `📌 **Event Panel**\n\nSelect an option:`,
    components: rows,
  };
}