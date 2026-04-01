// =====================================
// 📁 src/systems/devpanel/actions/devpanel.toggle.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 REGISTER
// =====================================

export function registerDevpanelActions() {
  // =====================================
  // 🔘 TOGGLE SYSTEM
  // =====================================

  registerUIAction("devpanel.toggle", {
    system: "devpanel",

    handler: async (interaction, _ctx, payload) => {
      if (!interaction.isButton()) return;

      const system = payload?.system;
      if (!system) return;

      const { setSystemEnabled } = await import(
        "@/runtime/runtimeState"
      );

      const { devpanelSystemsView } = await import(
        "../views/devpanel.view"
      );

      const current = await isSystemEnabled(system);

      await setSystemEnabled(system, !current);

      const view = await devpanelSystemsView();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // =====================================
  // 📂 OPEN SYSTEMS VIEW
  // =====================================

  registerUIAction("devpanel.systems", {
    system: "devpanel",

    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const { devpanelSystemsView } = await import(
        "../views/devpanel.view"
      );

      const view = await devpanelSystemsView();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  // =====================================
  // ⬅ BACK TO MAIN
  // =====================================

  registerUIAction("devpanel.back", {
    system: "devpanel",

    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const { devpanelMainView } = await import(
        "../views/devpanel.view"
      );

      const view = await devpanelMainView();

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}