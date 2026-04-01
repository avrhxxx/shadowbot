// =====================================
// 📁 src/ui/devpanel/devpanel.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 ACTIONS
// =====================================

registerUIAction(
  "devpanel.toggle",
  async (interaction, _ctx, payload) => {
    if (!interaction.isButton()) return;

    const system = payload?.system;

    if (!system) return;

    const { setSystemEnabled } = await import(
      "@/runtime/runtimeState"
    );

    const { devpanelMainView } = await import(
      "./devpanel.view"
    );

    const current = await isSystemEnabled(system);

    await setSystemEnabled(system, !current);

    const view = await devpanelMainView();

    await interaction.update({
      content: view.content,
      components: view.components,
    });
  }
);