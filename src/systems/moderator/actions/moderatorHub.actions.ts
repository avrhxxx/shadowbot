// =====================================
// 📁 src/systems/moderator/actions/moderatorHub.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

// =====================================
// 🔹 REGISTER
// =====================================

export function registerModeratorHubActions() {
  // Lista placeholderów dla każdego przycisku
  const placeholderMenus = [
    { action: "moderator.openEventMenu", label: "Event Menu" },
    { action: "moderator.openPointsMenu", label: "Points Menu" },
    { action: "moderator.openAbsenceMenu", label: "Absence Menu" },
    { action: "moderator.openTranslateMenu", label: "Translate Menu" },
    { action: "moderator.openHelpMenu", label: "Help" },
  ];

  // 🔹 Rejestracja każdej akcji jako placeholder
  for (const menu of placeholderMenus) {
    registerUIAction(menu.action, {
      system: "moderator",
      handler: async (interaction) => {
        if (!interaction.isButton()) return;

        console.log(`[MODERATOR HUB] Clicked placeholder: ${menu.label}`);

        await interaction.update({
          content: `📌 Placeholder for **${menu.label}** menu`,
          components: [], // brak przycisków w placeholderze
        });
      },
    });
  }
}