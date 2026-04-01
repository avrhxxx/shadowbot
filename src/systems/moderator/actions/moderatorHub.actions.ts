// =====================================
// 📁 src/systems/moderator/actions/moderatorHub.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction, EmbedBuilder } from "discord.js";

import { renderEventPanel } from "@/systems/events/views/eventPanel"; // ← pokażesz mi potem jeśli path inny
import { renderPointsPanel } from "@/systems/points/views/pointsPanel";
import { renderAbsencePanel } from "@/systems/absence/views/absencePanel";

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
      // 🔹 EVENTS
      // =====================================

      if (target === "events") {
        const panel = renderEventPanel();

        await interaction.update({
          content: panel.content,
          components: panel.components,
        });

        return;
      }

      // =====================================
      // 🔹 POINTS
      // =====================================

      if (target === "points") {
        const panel = renderPointsPanel();

        await interaction.update({
          content: panel.content,
          components: panel.components,
        });

        return;
      }

      // =====================================
      // 🔹 ABSENCE
      // =====================================

      if (target === "absence") {
        const panel = renderAbsencePanel();

        await interaction.update({
          content: panel.content,
          components: panel.components,
        });

        return;
      }

      // =====================================
      // 🔹 QUICKADD (placeholder)
      // =====================================

      if (target === "quickadd") {
        await interaction.update({
          content: "📌 QuickAdd Panel (coming soon)",
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
              value:
                "Create events, manage participants, cancel events, download lists.",
            },
            {
              name: "⭐ Points Menu",
              value: "Manage points and rankings.",
            },
            {
              name: "🕒 Absence Menu",
              value:
                "Manage absences: add/remove, see current absences, automatic notifications.",
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