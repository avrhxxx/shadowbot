// =====================================
// 📁 src/systems/devpanel/actions/devpanel.toggle.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 ACTION
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

    const { devpanelMainView } = await import(
      "../views/devpanel.view"
    );

    const current = await isSystemEnabled(system);

    await setSystemEnabled(system, !current);

    const view = await devpanelMainView();

    await interaction.update({
      content: view.content,
      components: view.components,
    });
  },
});