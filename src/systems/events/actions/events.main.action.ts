// =====================================
// 📁 src/systems/events/actions/events.main.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction } from "discord.js";

import { renderEventsMain } from "../views/events.main.view";
import { handleCreateFlow } from "../create/events.create.action";
import { handleListFlow } from "../list/events.list.action";
import { handleManualReminderFlow } from "../reminder/reminder.action";
import { handleCancelFlow } from "../manage/cancel.action";
import { handleSettingsFlow } from "../settings/settings.action";
import { handleHelpFlow } from "../help/events.help.action"; // jeśli masz taki

type EventsPayload = {
  action?: "create" | "list" | "manualReminder" | "cancel" | "settings" | "help" | "back";
};

export function registerEventsMainActions() {
  registerUIAction("events.open", {
    system: "events",
    handler: async (interaction: Interaction, _ctx, payload: EventsPayload) => {
      if (!interaction.isButton()) return;

      const action = payload?.action;

      // 🔹 kliknięto przycisk Back → wróć do moderator hub
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

      // 🔹 kliknięto Help
      if (action === "help") {
        await handleHelpFlow(interaction, _ctx, payload);
        return;
      }

      // 🔹 kliknięto konkretną akcję events → delegacja do feature flow
      const flowMap: Record<string, (i: Interaction, c: any, p: EventsPayload) => Promise<void>> = {
        create: handleCreateFlow,
        list: handleListFlow,
        manualReminder: handleManualReminderFlow,
        cancel: handleCancelFlow,
        settings: handleSettingsFlow,
      };

      if (action && action in flowMap) {
        await flowMap[action](interaction, _ctx, payload);
        return;
      }

      // 🔹 brak action → render main events panel
      const view = await renderEventsMain();
      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}