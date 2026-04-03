// =====================================
// 📁 src/systems/events/create/stepsViews/birthdayForm.view.ts
// =====================================

import type { View } from "@/shared/types";

// ----------------------------
// VIEW: MODAL FORM FOR BIRTHDAY EVENT
// ----------------------------
export async function birthdayFormView(): Promise<View> {
  return {
    content: "🎂 Fill in Birthday Event details:",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4, // TextInput
            custom_id: "day",
            label: "Day (1-31)",
            style: 1, // short
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4, // TextInput
            custom_id: "month",
            label: "Month (1-12)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4, // TextInput
            custom_id: "hours",
            label: "Hours (0-23, UTC)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4, // TextInput
            custom_id: "minutes",
            label: "Minutes (0-59, UTC)",
            style: 1,
            min_length: 1,
            max_length: 2,
            required: true,
          },
          {
            type: 4, // TextInput
            custom_id: "name",
            label: "Name of the birthday person",
            style: 1,
            required: true,
          },
          {
            type: 4, // TextInput
            custom_id: "notify",
            label: "Notify channel? (yes/no)",
            style: 1,
            required: true,
          },
        ],
      },
    ],
  };
}