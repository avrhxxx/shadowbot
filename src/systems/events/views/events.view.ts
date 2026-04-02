// =====================================
// 📁 src/systems/events/views/events.view.ts
// =====================================

import { renderModeratorHub } from "@/systems/moderator/views/moderator.view";

export async function renderEventsView() {
  const content = "📌 **Event Panel**";

  const buttons: any[] = [
    {
      type: 2,
      label: "Create Event",
      style: 1,
      custom_id: "events.action|type=create",
    },
    {
      type: 2,
      label: "Events List",
      style: 1,
      custom_id: "events.action|type=list",
    },
    {
      type: 2,
      label: "Manual Reminder",
      style: 1,
      custom_id: "events.action|type=reminder",
    },
    {
      type: 2,
      label: "Show All",
      style: 1,
      custom_id: "events.action|type=showAll",
    },
    {
      type: 2,
      label: "Cancel Event",
      style: 4,
      custom_id: "events.action|type=cancel",
    },
    {
      type: 2,
      label: "Guide",
      style: 3,
      custom_id: "events.action|type=help",
    },
    {
      type: 2,
      label: "Settings",
      style: 2,
      custom_id: "events.action|type=settings",
    },
  ];

  // 🔹 przycisk Back na końcu
  buttons.push({
    type: 2,
    label: "⬅ Back",
    style: 2,
    custom_id: "moderator.open|target=hub",
  });

  // 🔹 podział na rzędy max 5 przycisków
  const rows: any[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ type: 1, components: buttons.slice(i, i + 5) });
  }

  return {
    content,
    components: rows,
  };
}