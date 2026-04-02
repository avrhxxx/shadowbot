// =====================================
// 📁 src/systems/absence/views/absence.view.ts
// =====================================

import type { ViewResult } from "@/core/ui/uiEngine";

// =====================================
// 🔹 VIEW
// =====================================

export function renderAbsenceView(): ViewResult {
  return {
    content: "🕒 **Absence Panel**",
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Add Absence",
            style: 1,
            custom_id: "absence.action|type=add",
          },
          {
            type: 2,
            label: "Remove Absence",
            style: 4,
            custom_id: "absence.action|type=remove",
          },
          {
            type: 2,
            label: "Active Absences",
            style: 1,
            custom_id: "absence.action|type=list",
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "History",
            style: 2,
            custom_id: "absence.action|type=history",
          },
        ],
      },
    ],
  };
}