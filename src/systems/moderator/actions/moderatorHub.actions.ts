// =====================================
// 📁 src/systems/moderator/actions/moderatorHub.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { Interaction, EmbedBuilder } from "discord.js";

// =====================================
// 🔹 REGISTER
// =====================================

export function registerModeratorHubActions() {
  // Lista placeholderów dla większości przycisków
  const placeholderMenus = [
    { action: "moderator.openEventMenu", label: "Event Menu" },
    { action: "moderator.openPointsMenu", label: "Points Menu" },
    { action: "moderator.openAbsenceMenu", label: "Absence Menu" },
    { action: "moderator.openQuickAddMenu", label: "QuickAdd Menu" },
    { action: "moderator.openTranslateMenu", label: "Translate Menu" },
  ];

  // 🔹 Rejestracja placeholderów
  for (const menu of placeholderMenus) {
    registerUIAction(menu.action, {
      system: "moderator",
      handler: async (interaction: Interaction) => {
        if (!interaction.isButton()) return;

        console.log(`[MODERATOR HUB] Clicked placeholder: ${menu.label}`);

        await interaction.update({
          content: `📌 Placeholder for **${menu.label}** menu`,
          components: [], // brak przycisków w placeholderze
        });
      },
    });
  }

  // 🔹 Rejestracja Help (pełny embed)
  registerUIAction("moderator.openHelpMenu", {
    system: "moderator",
    handler: async (interaction: Interaction) => {
      if (!interaction.isButton()) return;

      const embed = new EmbedBuilder()
        .setTitle("Moderator Panel Guide")
        .setColor(0x1E90FF)
        .addFields(
          {
            name: "🟢 Event Menu",
            value: "Opens Event Panel: create events, manage participants, cancel events, download lists."
          },
          {
            name: "⭐ Points Menu",
            value: "Not implemented yet."
          },
          {
            name: "🕒 Absence Menu",
            value: "Manage absences: add/remove, see current absences, automatic notifications."
          },
          {
            name: "📝 Translate Menu",
            value: "Not implemented yet."
          },
          {
            name: "❓ Help",
            value: "Shows this description."
          }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    },
  });
}