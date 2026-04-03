// =====================================
// 📁 src/systems/events/actions/events.main.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction } from "discord.js";

import { renderEventsMain } from "../views/events.main.view";

// 🔹 Tymczasowe stuby, żeby build przeszedł
export async function handleCreateFlow() {}
export async function handleListFlow() {}
export async function handleManualReminderFlow() {}
export async function handleCancelFlow() {}
export async function handleSettingsFlow() {}
export async function handleHelpFlow(interaction: Interaction, _ctx: any, _payload: any) {}

type EventsPayload = {
  action?: "create" | "list" | "manualReminder" | "cancel" | "settings" | "help" | "back";
};

export function registerEventsMainActions() {
  registerUIAction("events.main", {
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