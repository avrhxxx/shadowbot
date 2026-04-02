// =====================================
// 📁 src/systems/absence/views/absence.view.ts
// =====================================

import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 TYPES
// =====================================

type View = {
  content: string;
  components: any[];
};

// =====================================
// 🕒 ABSENCE VIEW
// =====================================

export async function renderAbsenceView(): Promise<View> {
  const buttons: any[] = [];

  const actions = [
    { label: "Add Absence", type: "add", style: 1 },
    { label: "Remove Absence", type: "remove", style: 4 },
    { label: "Active Absences", type: "list", style: 1 },
    { label: "History", type: "history", style: 2 },
  ];

  for (const action of actions) {
    // 🔹 opcjonalnie możemy filtrować wg włączonych systemów, np. absence
    const enabled = await isSystemEnabled("absence");
    if (!enabled) continue;

    buttons.push({
      type: 2,
      label: action.label,
      style: action.style,
      custom_id: `absence.action|type=${action.type}`,
    });
  }

  // 🔹 podział na rzędy (max 5 przycisków na rząd)
  const rows: any[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({
      type: 1,
      components: buttons.slice(i, i + 5),
    });
  }

  return {
    content: "🕒 **Absence Panel**",
    components: rows,
  };
}