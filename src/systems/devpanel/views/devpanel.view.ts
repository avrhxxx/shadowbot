// =====================================
// 📁 src/ui/devpanel/devpanel.view.ts
// =====================================

import { SYSTEM_REGISTRY } from "@/runtime/runtimeRegistry";
import { isSystemEnabled } from "@/runtime/runtimeState";
import { View, createButton, createBackButton } from "@/ui/core/uiEngine";

// =====================================
// 🧠 MAIN VIEW
// =====================================

export const devpanelMainView: View = {
  id: "devpanel.main",
  render: async () => ({
    content: `⚙️ **Dev Panel**\n\nSelect category:`,
    components: [
      createButton("Systems", "devpanel.systems"),
    ],
  }),
};

// =====================================
// 🧠 SYSTEMS VIEW
// =====================================

export const devpanelSystemsView: View = {
  id: "devpanel.systems",
  render: async () => {
    const lines: string[] = [];
    const components = [];

    for (const system of SYSTEM_REGISTRY) {
      if (system.name === "devpanel") continue;

      const enabled = await isSystemEnabled(system.name);
      const status = enabled ? "🟢 ON" : "🔴 OFF";

      lines.push(`**${system.name}** → ${status}`);
      components.push(createButton(system.name, "devpanel.toggle", enabled ? "primary" : "secondary", { system: system.name }));
    }

    // Dodaj Back na dole
    components.push(createBackButton("devpanel.main"));

    return {
      content: `⚙️ **Dev Panel → Systems**\n\n${lines.join("\n")}`,
      components,
    };
  },
};
