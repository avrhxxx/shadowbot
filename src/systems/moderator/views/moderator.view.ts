// =====================================
// 📁 src/systems/moderator/views/moderator.view.ts
// =====================================

import { isSystemEnabled } from "@/runtime/runtimeState";
import { View, createButton, createBackButton } from "@/ui/core/uiEngine";
import { eventMainView } from "@/systems/events/main/event.main.view";

// =====================================
// 🧠 HUB VIEW
// =====================================

export const moderatorHubView: View = {
  id: "moderator.hub",
  render: async () => {
    const buttons = [];

    const systems = [
      { name: "events", label: "Event Menu" },
      { name: "points", label: "Points Menu" },
      { name: "absence", label: "Absence Menu" },
      { name: "quickadd", label: "QuickAdd Menu" },
    ];

    for (const sys of systems) {
      const enabled = await isSystemEnabled(sys.name);
      if (!enabled) continue;

      buttons.push(createButton(sys.label, "moderator.open", "primary", { target: sys.name }));
    }

    // 🔹 HELP
    buttons.push(createButton("Help", "moderator.open", "secondary", { target: "help" }));

    return { content: "📌 **Moderator Panel**\n\nSelect an option:", buttons };
  },
};

// =====================================
// 🧠 OTHER VIEWS
// =====================================

export const moderatorEventsView: View = {
  id: "moderator.events",
  render: async () => eventMainView(),
};

export const moderatorPointsView: View = {
  id: "moderator.points",
  render: async () => ({
    content: "⭐ **Points Panel** (placeholder content)",
    buttons: [createBackButton("moderator.hub")],
  }),
};

export const moderatorAbsenceView: View = {
  id: "moderator.absence",
  render: async () => ({
    content: "🕒 **Absence Panel** (placeholder content)",
    buttons: [createBackButton("moderator.hub")],
  }),
};

export const moderatorHelpView: View = {
  id: "moderator.help",
  render: async () => ({
    content: `
📌 **Moderator Panel Guide**

🟢 Event Menu → Create events, manage participants, cancel events.
⭐ Points Menu → Manage points and rankings.
🕒 Absence Menu → Manage absences and schedules.
⚡ QuickAdd → Fast data input system (OCR, parser).
❓ Help → Shows this description.
`.trim(),
    buttons: [createBackButton("moderator.hub")],
  }),
};
