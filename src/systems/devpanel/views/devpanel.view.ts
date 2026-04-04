// =====================================
// 📁 src/ui/devpanel/devpanel.view.ts
// =====================================

import { SYSTEM_REGISTRY } from "@/runtime/runtimeRegistry";
import { isSystemEnabled } from "@/runtime/runtimeState";

import { button } from "@/ui/api";
import type { View } from "@/ui/types/uiTypes";
import type { TraceContext } from "@/trace";

// =====================================
// 🧠 MAIN VIEW
// =====================================

export const devpanelMainView: View = {
  id: "devpanel.main",

  render: async (_ctx: TraceContext) => ({
    content: `⚙️ **Dev Panel**\n\nSelect category:`,
    buttons: [
      button.create("Systems", "devpanel.systems"), // przejście do systemów
    ],
  }),
};

// =====================================
// 🧠 SYSTEMS VIEW
// =====================================

export const devpanelSystemsView: View = {
  id: "devpanel.systems",

  render: async (_ctx: TraceContext) => {
    const lines: string[] = [];
    const buttons = [];

    // generowanie listy systemów z przyciskami toggle
    for (const system of SYSTEM_REGISTRY) {
      if (system.name === "devpanel") continue; // pomijamy sam devpanel

      const enabled = await isSystemEnabled(system.name);
      const status = enabled ? "🟢 ON" : "🔴 OFF";

      lines.push(`**${system.name}** → ${status}`);

      buttons.push(
        button.create(
          system.name,           // label
          "devpanel.toggle",     // action
          enabled ? "primary" : "secondary", // style
          { system: system.name } // state / payload
        )
      );
    }

    // 🔙 Back button
    buttons.push(button.back("devpanel.main"));

    return {
      content: `⚙️ **Dev Panel → Systems**\n\n${lines.join("\n")}`,
      buttons,
    };
  },
};