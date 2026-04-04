import { SYSTEM_REGISTRY } from "@/runtime/runtimeRegistry";
import { isSystemEnabled } from "@/runtime/runtimeState";

import { button, view } from "@/ui/api";
import type { View } from "@/ui/types/uiTypes";

// =====================================
// 🧠 MAIN VIEW
// =====================================

export const devpanelMainView: View = {
  id: "devpanel.main",

  render: async () => ({
    content: `⚙️ **Dev Panel**\n\nSelect category:`,
    buttons: button.row([
      button.create("Systems", "devpanel.systems"),
    ]),
  }),
};

// =====================================
// 🧠 SYSTEMS VIEW
// =====================================

export const devpanelSystemsView: View = {
  id: "devpanel.systems",

  render: async () => {
    const lines: string[] = [];
    const buttonsList = [];

    for (const system of SYSTEM_REGISTRY) {
      if (system.name === "devpanel") continue;

      const enabled = await isSystemEnabled(system.name);
      const status = enabled ? "🟢 ON" : "🔴 OFF";

      lines.push(`**${system.name}** → ${status}`);

      buttonsList.push(
        button.create(
          system.name,
          "devpanel.toggle",
          enabled ? "primary" : "secondary",
          { system: system.name }
        )
      );
    }

    // 🔙 Back button jako część rzędu
    const buttons = button.row([...buttonsList, button.back("devpanel.main")]);

    return {
      content: `⚙️ **Dev Panel → Systems**\n\n${lines.join("\n")}`,
      buttons,
    };
  },
};