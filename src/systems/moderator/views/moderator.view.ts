// =====================================
// 📁 src/systems/moderator/views/moderator.view.ts
// =====================================

import { isSystemEnabled } from "@/runtime/runtimeState";
import { renderEventsView as eventsView } from "@/systems/events/views/events.view";

// =====================================
// 🔹 TYPES
// =====================================

export type ViewResult = {
  content: string;
  components: any[];
};

// =====================================
// 🧠 HUB VIEW
// =====================================

export async function renderModeratorHub(): Promise<ViewResult> {
  const buttons: any[] = [];

  const systems = [
    { name: "events", label: "Event Menu" },
    { name: "points", label: "Points Menu" },
    { name: "absence", label: "Absence Menu" },
    { name: "quickadd", label: "QuickAdd Menu" },
  ];

  for (const sys of systems) {
    const enabled = await isSystemEnabled(sys.name);
    if (!enabled) continue;

    buttons.push({
      type: 2,
      label: sys.label,
      style: 1, // Primary
      custom_id: `moderator.open|target=${sys.name}`,
    });
  }

  // 🔹 HELP
  buttons.push({
    type: 2,
    label: "Help",
    style: 2, // Secondary
    custom_id: `moderator.open|target=help`,
  });

  // 🔹 podział na rzędy (max 5 przycisków)
  const rows: any[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }

  return {
    content: `📌 **Moderator Panel**\n\nSelect an option:`,
    components: rows,
  };
}

// =====================================
// 🧠 EVENTS, POINTS, ABSENCE VIEWS
// =====================================

export async function renderEventsView(): Promise<ViewResult> {
  return await eventsView(); // 🔹 podmieniamy placeholder na prawdziwy EventsView
}

export async function renderPointsView(): Promise<ViewResult> {
  return {
    content: "⭐ **Points Panel** (placeholder content)",
    components: [],
  };
}

export async function renderAbsenceView(): Promise<ViewResult> {
  return {
    content: "🕒 **Absence Panel** (placeholder content)",
    components: [],
  };
}