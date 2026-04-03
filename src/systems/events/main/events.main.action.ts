// =====================================
// 📁 src/systems/events/main/events.main.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

// 🔹 Importujemy step-y
import { registerBirthdayFormStep } from "@/systems/events/create/steps/birthdayForm.step";
import { registerCustomEventFormStep } from "@/systems/events/create/steps/customEventForm.step";
import { registerSelectDayStep } from "@/systems/events/create/steps/selectDay.step";
import { registerSelectTimeStep } from "@/systems/events/create/steps/selectTime.step";
import { registerConfirmEventStep } from "@/systems/events/create/steps/confirmEvent.step";
import { registerSubmitEventStep } from "@/systems/events/create/steps/submitEvent.step";

// =====================================
// 🚀 REGISTER MAIN ACTIONS
// =====================================

export function registerEventsMainActions() {

  // =====================================
  // 🔹 REGISTER ALL STEPS
  // =====================================
  registerBirthdayFormStep();
  registerCustomEventFormStep();
  registerSelectDayStep();
  registerSelectTimeStep();
  registerConfirmEventStep();
  registerSubmitEventStep();

  // =====================================
  // 🔹 CREATE (podłączony do startu flow)
  // =====================================
  registerUIAction("events.main.create", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      // 🔹 Lazy import start view selectDay
      const { selectDayStepView } = await import("@/systems/events/create/steps/selectDay.step.view");
      const view = await selectDayStepView();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // =====================================
  // 🔹 LIST (placeholder)
  // =====================================
  registerUIAction("events.main.list", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.reply({
        content: "📋 Events List (coming soon)",
        ephemeral: true,
      });
    },
  });

  // =====================================
  // 🔹 REMINDER (placeholder)
  // =====================================
  registerUIAction("events.main.reminder", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.reply({
        content: "⏰ Manual Reminder (coming soon)",
        ephemeral: true,
      });
    },
  });

  // =====================================
  // 🔹 SHOW ALL (placeholder)
  // =====================================
  registerUIAction("events.main.show_all", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.reply({
        content: "📊 Show All (coming soon)",
        ephemeral: true,
      });
    },
  });

  // =====================================
  // 🔹 CANCEL (placeholder)
  // =====================================
  registerUIAction("events.main.cancel", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.reply({
        content: "❌ Cancel Event (coming soon)",
        ephemeral: true,
      });
    },
  });

  // =====================================
  // 🔹 GUIDE (placeholder)
  // =====================================
  registerUIAction("events.main.guide", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.reply({
        content: "📖 Guide (coming soon)",
        ephemeral: true,
      });
    },
  });

  // =====================================
  // 🔹 SETTINGS (placeholder)
  // =====================================
  registerUIAction("events.main.settings", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.reply({
        content: "⚙️ Settings (coming soon)",
        ephemeral: true,
      });
    },
  });

  // =====================================
  // 🔹 BACK TO MODERATOR HUB
  // =====================================
  registerUIAction("moderator.open|target=hub", {
    system: "moderator",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      // 🔹 delegujemy kliknięcie do moderator hub
      await interaction.client.emit("ui.router.interaction.received", {
        id: "moderator.open|target=hub",
        user: interaction.user,
        channel: interaction.channel,
        message: interaction.message,
        interaction,
      });
    },
  });
}