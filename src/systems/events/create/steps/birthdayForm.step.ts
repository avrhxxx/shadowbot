// =====================================
// 📁 src/systems/events/create/steps/birthdayForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// =====================================
// 🧠 VIEW
// =====================================
export function birthdayFormView() {
  return {
    content: "🎉 **Birthday Event**\n\nConfigure your event:",
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Set Date (DD/MM)",
            style: 1,
            action: "events.create.birthdayForm.setDate",
          },
          {
            type: 2,
            label: "Set Time (HH:MM)",
            style: 1,
            action: "events.create.birthdayForm.setTime",
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Submit",
            style: 3,
            action: "events.create.birthdayForm.submit",
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "⬅ Back",
            style: 2,
            action: "events.create.backToMain",
          },
        ],
      },
    ],
  };
}

// =====================================
// 🚀 REGISTER STEP
// =====================================
export function registerBirthdayFormStep() {
  // 🔹 OPEN FORM
  registerUIAction("events.create.birthdayForm", {
    system: "events",
    handler: async (ctx, payload) => {
      const view = birthdayFormView();

      // renderujemy widok przez UI Engine, nie Discord
      await ctx.renderView(view, payload);
    },
  });

  // 🔹 SUBMIT
  registerUIAction("events.create.birthdayForm.submit", {
    system: "events",
    handler: async (ctx, payload) => {
      // 🔴 Placeholder – później będzie dynamiczny state
      const day = payload?.day || 1;
      const month = payload?.month || 1;
      const hours = payload?.hours || 12;
      const minutes = payload?.minutes || 0;
      const name = payload?.name || "User";

      const formatted = formatEventUTC(day, month, hours, minutes);

      const view = {
        content: `🎉 Birthday Event for **${name}** set on **${formatted}**`,
        components: [],
      };

      await ctx.renderView(view, payload);
    },
  });
}