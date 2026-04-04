// =====================================
// 📁 src/systems/moderator/views/moderator.view.ts
// =====================================

import { isSystemEnabled } from "@/runtime/runtimeState";
import { view, button } from "@/ui/api";
import { eventMainView } from "@/systems/events/main/event.main.view";

// =====================================
// 🧠 HUB VIEW
// =====================================

export const moderatorHubView = view.create({
  id: "moderator.hub",
  render: async () => {
    const components = [];

    const systems = [
      { name: "events", label: "Event Menu" },
      { name: "points", label: "Points Menu" },
      { name: "absence", label: "Absence Menu" },
      { name: "quickadd", label: "QuickAdd Menu" },
    ];

    for (const sys of systems) {
      const enabled = await isSystemEnabled(sys.name);
      if (!enabled) continue;

      components.push(
        button.create(sys.label, "moderator.open", "primary", { target: sys.name })
      );
    }

    // 🔹 HELP
    components.push(button.create("Help", "moderator.open", "secondary", { target: "help" }));

    return {
      content: "📌 **Moderator Panel**\n\nSelect an option:",
      buttons: components,
    };
  },
});

// =====================================
// 🧠 OTHER VIEWS
// =====================================

export const moderatorEventsView = view.create({
  id: "moderator.events",
  render: async () => eventMainView(),
});

export const moderatorPointsView = view.create({
  id: "moderator.points",
  render: async () => ({
    content: "⭐ **Points Panel** (placeholder content)",
    buttons: [button.back("moderator.hub")],
  }),
});

export const moderatorAbsenceView = view.create({
  id: "moderator.absence",
  render: async () => ({
    content: "🕒 **Absence Panel** (placeholder content)",
    buttons: [button.back("moderator.hub")],
  }),
});

export const moderatorHelpView = view.create({
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
    buttons: [button.back("moderator.hub")],
  }),
});