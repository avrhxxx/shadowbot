// =====================================
// 📁 src/systems/events/main/event.main.view.ts
// =====================================

import { View, createButton, createBackButton } from "@/ui/core/uiEngine";

export const eventMainPanel: View = {
  id: "events.main",
  render: async () => {
    const buttons = [
      createButton("Create Event", "events.main", "primary", { target: "create" }),
      createButton("Events List", "events.main", "primary", { target: "list" }),
      createButton("Manual Reminder", "events.main", "primary", { target: "manualReminder" }),
      createButton("Show All", "events.main", "primary", { target: "showAll" }),
      createButton("Cancel Event", "events.main", "danger", { target: "cancel" }),
      createButton("Guide", "events.main", "secondary", { target: "help" }),
      createButton("Settings", "events.main", "secondary", { target: "settings" }),
    ];

    // 🔹 Back button do moderator hub
    buttons.push(createBackButton("moderator.hub"));

    return {
      content: "📌 **Event Panel**\n\nSelect an option:",
      buttons,        // <- teraz zgodnie z UI API, renderView mapuje je na components
      ephemeral: true, // opcjonalnie możesz ustawić domyślnie ephemeral
    };
  },
};