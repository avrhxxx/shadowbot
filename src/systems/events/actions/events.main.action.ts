// =====================================
// 📁 src/systems/events/actions/events.main.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction } from "discord.js";

import { renderEventsMain } from "../views/events.main.view";
import { handleCreateFlow } from "../create/events.create.action"; // 🔹 import flow create

// 🔹 Placeholder imports na przyszłość (jeszcze nie istnieją)
// import { handleListFlow } from "../list/events.list.action";
// import { handleManualReminderFlow } from "../reminder/reminder.action";
// import { handleCancelFlow } from "../manage/cancel.action";
// import { handleSettingsFlow } from "../settings/settings.action";

type EventsPayload = {
  action?: "create" | "list" | "manualReminder" | "cancel" | "settings" | "help" | "back" | "showAll";
  step?: string;
  tempId?: string;
  userId?: string;
};

export function registerEventsMainActions() {
  registerUIAction("events.main", {
    system: "events",
    handler: async (interaction: Interaction, _ctx, payload: EventsPayload) => {
      if (!interaction.isButton()) return;

      const action = payload?.action;

      // 🔹 Back → wróć do moderator hub
      if (action === "back") {
        await interaction.update({
          content: "📌 Returning to Moderator Panel...",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: "⬅ Back to Hub",
                  style: 2,
                  custom_id: "moderator.open|target=hub",
                },
              ],
            },
          ],
        });
        return;
      }

      // 🔹 Help → wbudowany w main action
      if (action === "help") {
        await interaction.update({
          content: `
📌 **Events Panel Guide**

🟢 Create Event → Create a new event.
🟢 Events List → View all events.
🟢 Manual Reminder → Send a manual reminder.
🟢 Show All → Show all events.
🔴 Cancel Event → Cancel a planned event.
⚙ Settings → Configure event options.
❓ Guide → Show this help panel.
        `.trim(),
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: "⬅ Back",
                  style: 2,
                  custom_id: "events.main|action=back",
                },
              ],
            },
          ],
        });
        return;
      }

      // 🔹 Delegacja do feature flow
      const flowMap: Record<string, (i: Interaction, c: any, p: EventsPayload) => Promise<void>> = {
        create: handleCreateFlow,
        // list: handleListFlow,
        // manualReminder: handleManualReminderFlow,
        // cancel: handleCancelFlow,
        // settings: handleSettingsFlow,
      };

      if (action && action in flowMap) {
        await flowMap[action](interaction, _ctx, payload);
        return;
      }

      // 🔹 Brak action lub placeholder → render main events panel
      const view = await renderEventsMain();
      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}