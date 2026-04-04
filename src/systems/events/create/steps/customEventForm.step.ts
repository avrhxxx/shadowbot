// =====================================
// 📁 src/systems/events/create/steps/customEventForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";
import { Interaction } from "discord.js";

// =====================================
// 🧠 VIEW
// =====================================
export function customEventFormView() {
  return {
    title: "📝 Custom Event",
    customId: "events.create.customForm.submit",
    components: [
      {
        type: 1,
        components: [
          { type: 4, customId: "eventName", style: 1, label: "Event Name", placeholder: "Enter event name", required: true },
          { type: 4, customId: "day", style: 1, label: "Day", placeholder: "Enter day (1-31)", required: true },
          { type: 4, customId: "month", style: 1, label: "Month", placeholder: "Enter month (1-12)", required: true },
          { type: 4, customId: "hours", style: 1, label: "Hours", placeholder: "0-23", required: true },
          { type: 4, customId: "minutes", style: 1, label: "Minutes", placeholder: "0-59", required: true },
        ],
      },
    ],
  };
}

// =====================================
// 🚀 REGISTER STEP
// =====================================
export function registerCustomEventFormStep() {
  // 🔹 Otwarcie formularza Custom Event
  registerUIAction("events.create.customEventForm", {
    system: "events",
    handler: async (interaction: Interaction) => {
      // upewniamy się, że to button
      if (!("isButton" in interaction) || !interaction.isButton()) return;

      await interaction.showModal(customEventFormView());
    },
  });

  // 🔹 Submit formularza Custom Event
  registerUIAction("events.create.customForm.submit", {
    system: "events",
    handler: async (interaction: Interaction) => {
      // upewniamy się, że to modal
      if (!("isModalSubmit" in interaction) || !interaction.isModalSubmit()) return;

      const eventName = interaction.fields.getTextInputValue("eventName");
      const day = Number(interaction.fields.getTextInputValue("day"));
      const month = Number(interaction.fields.getTextInputValue("month"));
      const hours = Number(interaction.fields.getTextInputValue("hours"));
      const minutes = Number(interaction.fields.getTextInputValue("minutes"));

      const formatted = formatEventUTC(day, month, hours, minutes);

      await interaction.reply({
        content: `**${formatted}** 📝 Custom Event: **${eventName}**`,
        ephemeral: true,
      });
    },
  });
}