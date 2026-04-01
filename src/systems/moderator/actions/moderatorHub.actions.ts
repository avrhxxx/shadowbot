// =====================================
// 📁 src/systems/moderator/actions/moderatorHub.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

// =====================================
// 🔹 REGISTER
// =====================================

export function registerModeratorHubActions() {
  // =====================================
  // 🔘 OPEN EVENT MENU
  // =====================================
  registerUIAction("moderator.openEventMenu", {
    system: "moderator",

    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const { renderEventPanel } = await import(
        "../views/moderatorEvent.view"
      );

      const view = await renderEventPanel();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // =====================================
  // 🔘 OPEN POINTS MENU
  // =====================================
  registerUIAction("moderator.openPointsMenu", {
    system: "moderator",

    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const { renderPointsPanel } = await import(
        "../views/moderatorPoints.view"
      );

      const view = await renderPointsPanel();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // =====================================
  // 🔘 OPEN ABSENCE MENU
  // =====================================
  registerUIAction("moderator.openAbsenceMenu", {
    system: "moderator",

    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const { renderAbsencePanel } = await import(
        "../views/moderatorAbsence.view"
      );

      const view = await renderAbsencePanel();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // =====================================
  // 🔘 OPEN TRANSLATE MENU
  // =====================================
  registerUIAction("moderator.openTranslateMenu", {
    system: "moderator",

    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const { renderTranslatePanel } = await import(
        "../views/moderatorTranslate.view"
      );

      const view = await renderTranslatePanel();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // =====================================
  // 🔘 OPEN HELP MENU
  // =====================================
  registerUIAction("moderator.openHelpMenu", {
    system: "moderator",

    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const { renderHelpPanel } = await import(
        "../views/moderatorHelp.view"
      );

      const view = await renderHelpPanel();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}