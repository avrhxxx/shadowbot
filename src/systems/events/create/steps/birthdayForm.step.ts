// =====================================
// 📁 src/systems/events/create/steps/birthdayForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// =====================================
// 🧠 MODAL / VIEW
// =====================================
export function birthdayFormModal() {
  return {
    title: "🎉 Birthday Event",
    fields: [
      {
        type: "text",
        name: "nickname",
        label: "Nickname",
        placeholder: "Enter nickname for event",
        required: true,
      },
      {
        type: "number",
        name: "day",
        label: "Day",
        min: 1,
        max: 31,
        required: true,
      },
      {
        type: "number",
        name: "month",
        label: "Month",
        min: 1,
        max: 12,
        required: true,
      },
      {
        type: "number",
        name: "hours",
        label: "Hours",
        min: 0,
        max: 23,
        required: true,
      },
      {
        type: "number",
        name: "minutes",
        label: "Minutes",
        min: 0,
        max: 59,
        required: true,
      },
    ],
    cancelAction: "events.create.backToMain", // opcjonalnie wraca do panelu
  };
}

// =====================================
// 🚀 REGISTER STEP
// =====================================
export function registerBirthdayFormStep() {
  // 🔹 OPEN MODAL
  registerUIAction("events.create.birthdayForm", {
    system: "events",
    handler: async (ctx, payload) => {
      const modal = birthdayFormModal();

      // renderujemy modal przez nasz UI Engine
      await ctx.showModal(modal, payload);
    },
  });

  // 🔹 HANDLE MODAL SUBMIT
  registerUIAction("events.create.birthdayForm.submit", {
    system: "events",
    handler: async (ctx, payload) => {
      const day = Number(payload?.day || 1);
      const month = Number(payload?.month || 1);
      const hours = Number(payload?.hours || 12);
      const minutes = Number(payload?.minutes || 0);
      const nickname = payload?.nickname || "User";

      const formatted = formatEventUTC(day, month, hours, minutes);

      const view = {
        content: `🎉 Birthday Event for **${nickname}** set on **${formatted}**`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "⬅ Back to Main",
                style: 2,
                action: "events.create.backToMain",
              },
            ],
          },
        ],
      };

      await ctx.renderView(view, payload);
    },
  });
}