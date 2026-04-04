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
            custom_id: "events.create.birthdayForm.setDate",
          },
          {
            type: 2,
            label: "Set Time (HH:MM)",
            style: 1,
            custom_id: "events.create.birthdayForm.setTime",
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
            custom_id: "events.create.birthdayForm.submit",
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
            custom_id: "events.create.backToMain",
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
    handler: async (interaction, ctx) => {
      const view = birthdayFormView();

      // UI Router już daje nam interaction.update
      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // 🔹 SUBMIT
  registerUIAction("events.create.birthdayForm.submit", {
    system: "events",
    handler: async (interaction, ctx) => {
      // 🔴 Placeholder – później będzie dynamiczny state
      const day = 1;
      const month = 1;
      const hours = 12;
      const minutes = 0;
      const name = "User";

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.update({
        content: `🎉 Birthday Event for **${name}** set on **${formatted}**`,
        components: [],
      });
    },
  });
}