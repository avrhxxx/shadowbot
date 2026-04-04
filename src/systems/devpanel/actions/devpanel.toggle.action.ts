// =====================================
// 📁 src/systems/devpanel/actions/devpanel.toggle.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { devpanelSystemsView, devpanelMainView } from "../views/devpanel.view";
import { isSystemEnabled, setSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 REGISTER
// =====================================

export function registerDevpanelActions() {
  registerUIAction("devpanel.toggle", {
    system: "devpanel",
    handler: async (interaction, _ctx, payload) => {
      if (!interaction.isButton()) return;

      const system = payload?.system;
      if (!system) return;

      const current = await isSystemEnabled(system);
      await setSystemEnabled(system, !current);

      const view = await devpanelSystemsView.render();
      await interaction.update({ content: view.content, components: view.buttons });
    },
  });

  registerUIAction("devpanel.systems", {
    system: "devpanel",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const view = await devpanelSystemsView.render();
      await interaction.update({ content: view.content, components: view.buttons });
    },
  });

  registerUIAction("devpanel.back", {
    system: "devpanel",
    handler: async (interaction) => {
      if (!interaction.isButton()) return;

      const view = await devpanelMainView.render();
      await interaction.update({ content: view.content, components: view.buttons });
    },
  });
}