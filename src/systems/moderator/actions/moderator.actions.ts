// =====================================
// 📁 src/systems/moderator/actions/moderatorHub.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction, EmbedBuilder } from "discord.js";

import { renderModeratorHub } from "../views/moderatorHub.view";
import { renderEventsView } from "@/systems/events/views/events.view";
import { renderPointsView } from "@/systems/points/views/points.view";
import { renderAbsenceView } from "@/systems/absence/views/absence.view";

type ModeratorPayload = {
  target?: "hub" | "events" | "points" | "absence" | "quickadd" | "help";
};

export function registerModeratorHubActions() {
  registerUIAction("moderator.open", {
    system: "moderator",

    handler: async (interaction: Interaction, _ctx, payload: ModeratorPayload) => {
      if (!interaction.isButton()) return;

      const target = payload?.target;

      // 🔹 MAPA TARGET → RENDER VIEW
      const viewMap: Record<string, () => Promise<any>> = {
        hub: () => renderModeratorHub(),
        events: async () => await renderEventsView(),
        points: async () => await renderPointsView(),
        absence: async () => await renderAbsenceView(),
      };

      // 🔹 HANDLE VIEW TARGETS
      if (target && target in viewMap) {
        const view = await viewMap[target]();

        if (target === "hub") {
          await interaction.reply({ ...view, ephemeral: true });
        } else {
          await interaction.update(view);
        }

        return;
      }

      // 🔹 QUICKADD (placeholder)
      if (target === "quickadd") {
        await interaction.update({
          content: "⚡ QuickAdd Panel (coming soon)",
          components: [],
        });
        return;
      }

      // 🔹 HELP
      if (target === "help") {
        const embed = new EmbedBuilder()
          .setTitle("Moderator Panel Guide")
          .setColor(0x1E90FF)
          .addFields(
            {
              name: "🟢 Event Menu",
              value: "Create events, manage participants, cancel events.",
            },
            {
              name: "⭐ Points Menu",
              value: "Manage points and rankings.",
            },
            {
              name: "🕒 Absence Menu",
              value: "Manage absences and schedules.",
            },
            {
              name: "⚡ QuickAdd",
              value: "Fast data input system (OCR, parser).",
            },
            {
              name: "❓ Help",
              value: "Shows this description.",
            }
          );

        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });

        return;
      }
    },
  });
}
