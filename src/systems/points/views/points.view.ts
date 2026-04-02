// =====================================
// 📁 src/systems/points/views/points.view.ts
// =====================================

import type { ViewResult } from "@/core/ui/uiEngine";

// =====================================
// 🔹 VIEW
// =====================================

export function renderPointsView(): ViewResult {
  return {
    content: "⭐ **Points Panel**",
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Add Points",
            style: 1,
            custom_id: "points.action|type=add",
          },
          {
            type: 2,
            label: "Remove Points",
            style: 4,
            custom_id: "points.action|type=remove",
          },
          {
            type: 2,
            label: "Leaderboard",
            style: 1,
            custom_id: "points.action|type=leaderboard",
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
            custom_id: "points.action|type=history",
          },
          {
            type: 2,
            label: "Settings",
            style: 2,
            custom_id: "points.action|type=settings",
          },
        ],
      },
    ],
  };
}