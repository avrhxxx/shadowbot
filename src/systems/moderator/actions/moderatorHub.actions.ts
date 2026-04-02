// =====================================
// 📁 src/systems/moderator/actions/moderatorHub.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction, EmbedBuilder } from "discord.js";

import { renderModeratorHub } from "../views/moderatorHub.view";

import { renderEventsView } from "@/systems/events/views/events.view";
import { renderPointsView } from "@/systems/points/views/points.view";
import { renderAbsenceView } from "@/systems/absence/views/absence.view";

// =====================================
// 🔹 REGISTER
// =====================================

export function registerModeratorHubActions() {
  registerUIAction("moderator.open", {
    system: "moderator",

    handler: async (interaction: Interaction, _ctx, payload) => {
      if (!interaction.isButton()) return;

      const target = payload?.target;

      // =====================================
      // 🔹 HUB
      // =====================================

      if (target === "hub") {
        const view = await renderModeratorHub();

        await interaction.reply({
          ...view,
          ephemeral: true,
        });

        return;
      }

      // =====================================
      // 🔹 EVENTS
      // =====================================

      if (target === "events") {
        const view = renderEventsView();

        await interaction.update(view);
        return;
      }

      // =====================================
      // 🔹 POINTS
      // =====================================

      if (target === "points") {
        const view = renderPointsView();

        await interaction.update(view);
        return;
      }

      // =====================================
      // 🔹 ABSENCE
      // =====================================

      if (target === "absence") {
        const view = renderAbsenceView();

        await interaction.update(view);
        return;
      }

      // =====================================
      // 🔹 QUICKADD (placeholder)
      // =====================================

      if (target === "quickadd") {
        await interaction.update({
          content: "⚡ QuickAdd Panel (coming soon)",
          components: [],
        });

        return;
      }

      // =====================================
      // 🔹 HELP
      // =====================================

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