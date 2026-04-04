// =====================================
// 📁 src/systems/devpanel/actions/devpanel.toggle.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { renderViewInternal } from "@/ui/engine/engine";

import { isSystemEnabled, setSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 REGISTER
// =====================================

export function registerDevpanelActions() {
  registerUIAction("devpanel.toggle", {
    system: "devpanel",

    handler: async (interaction, ctx, payload) => {
      if (!interaction.isButton()) return;

      const system = payload?.system;
      if (!system) return;

      const current = await isSystemEnabled(system);
      await setSystemEnabled(system, !current);

      const view = await renderViewInternal(ctx, "devpanel.systems");

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  registerUIAction("devpanel.systems", {
    system: "devpanel",

    handler: async (interaction, ctx) => {
      if (!interaction.isButton()) return;

      const view = await renderViewInternal(ctx, "devpanel.systems");

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });

  registerUIAction("devpanel.back", {
    system: "devpanel",

    handler: async (interaction, ctx) => {
      if (!interaction.isButton()) return;

      const view = await renderViewInternal(ctx, "devpanel.main");

      await interaction.update({
        content: view.content,
        components: view.components,
      });
    },
  });
}