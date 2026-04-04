// =====================================
// 📁 src/systems/events/main/event.main.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { view } from "@/ui/api";
import { eventMainPanel } from "./event.main.view";

export function registerEventMainActions() {
  registerUIAction("events.main", {
    system: "events",
    handler: async (interaction, _ctx, payload: any) => {
      if (!interaction.isButton?.()) return;

      const target = payload?.target;

      try {
        switch (target) {
          case "create":
            await interaction.update({ content: "🚀 Create Event (placeholder)", components: [] });
            break;

          case "list":
            await interaction.update({ content: "📋 Events List (placeholder)", components: [] });
            break;

          case "manualReminder":
            await interaction.update({ content: "⚡ Manual Reminder (placeholder)", components: [] });
            break;

          case "showAll":
            await interaction.update({ content: "👀 Show All Events (placeholder)", components: [] });
            break;

          case "cancel":
            await interaction.update({ content: "❌ Cancel Event (placeholder)", components: [] });
            break;

          case "help":
            await interaction.update({
              content: `📌 **Event Panel Guide**\n\n- Create Event → start a new event\n- Events List → show upcoming events\n- Manual Reminder → send reminders\n- Show All → list all events\n- Cancel Event → cancel a scheduled event\n- Guide → show this help\n- Settings → panel configuration`,
              components: [],
            });
            break;

          case "settings":
            await interaction.update({ content: "⚙️ Settings (placeholder)", components: [] });
            break;

          default:
            // 🔹 pokaż główny widok przy użyciu nowego UI API
            await view.show(eventMainPanel, { ephemeral: true }, { interaction });
        }
      } catch (err) {
        console.error("Event main action failed:", err);
        await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
      }
    },
  });
}