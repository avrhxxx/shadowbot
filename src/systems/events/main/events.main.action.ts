// =====================================
// 📁 src/systems/events/main/events.main.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

// 🔹 Importujemy całą logikę create feature (stepy zarejestrowane)
import { initEventsCreateFeature } from "@/systems/events/create/eventsCreate.index";

// =====================================
// 🚀 REGISTER MAIN ACTIONS
// =====================================

export function registerEventsMainActions() {
  // =====================================
  // 🔹 INIT CREATE FEATURE (wszystkie step-y)
  // =====================================
  initEventsCreateFeature();

  // =====================================
  // 🔹 CREATE (podłączony do startu flow)
  // =====================================
  registerUIAction("events.main.create", {
    system: "events",
    handler: async (interaction: any) => {
      // Wywołujemy startowy step z feature bez importu view
      await interaction.client.emit("ui.router.interaction.received", {
        id: "events.create.selectDay",
        user: interaction.user,
        channel: interaction.channel,
        message: interaction.message,
        interaction,
      });
    },
  });

  // =====================================
  // 🔹 LIST (placeholder)
  // =====================================
  registerUIAction("events.main.list", {
    system: "events",
    handler: async (interaction: any) => {
      await interaction.reply({ content: "📋 Events List (coming soon)", ephemeral: true });
    },
  });

  // =====================================
  // 🔹 REMINDER (placeholder)
  // =====================================
  registerUIAction("events.main.reminder", {
    system: "events",
    handler: async (interaction: any) => {
      await interaction.reply({ content: "⏰ Manual Reminder (coming soon)", ephemeral: true });
    },
  });

  // =====================================
  // 🔹 SHOW ALL (placeholder)
  // =====================================
  registerUIAction("events.main.show_all", {
    system: "events",
    handler: async (interaction: any) => {
      await interaction.reply({ content: "📊 Show All (coming soon)", ephemeral: true });
    },
  });

  // =====================================
  // 🔹 CANCEL (placeholder)
  // =====================================
  registerUIAction("events.main.cancel", {
    system: "events",
    handler: async (interaction: any) => {
      await interaction.reply({ content: "❌ Cancel Event (coming soon)", ephemeral: true });
    },
  });

  // =====================================
  // 🔹 GUIDE (placeholder)
  // =====================================
  registerUIAction("events.main.guide", {
    system: "events",
    handler: async (interaction: any) => {
      await interaction.reply({ content: "📖 Guide (coming soon)", ephemeral: true });
    },
  });

  // =====================================
  // 🔹 SETTINGS (placeholder)
  // =====================================
  registerUIAction("events.main.settings", {
    system: "events",
    handler: async (interaction: any) => {
      await interaction.reply({ content: "⚙️ Settings (coming soon)", ephemeral: true });
    },
  });

  // =====================================
  // 🔹 BACK TO MODERATOR HUB
  // =====================================
  registerUIAction("moderator.open|target=hub", {
    system: "moderator",
    handler: async (interaction: any) => {
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