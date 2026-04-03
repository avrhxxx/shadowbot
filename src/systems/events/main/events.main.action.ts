// =====================================
// 📁 src/systems/events/main/events.main.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

// =====================================
// 🚀 REGISTER MAIN ACTIONS
// =====================================

export function registerEventsMainActions() {

  // =====================================
  // 🔹 CREATE (placeholder)
  // =====================================
  registerUIAction("events.main.create", {
    system: "events",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      await interaction.reply({
        content: "🛠️ Create Event (coming soon)",
        ephemeral: true,
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
}