// =====================================
// 📁 src/ui/devpanel/devpanel.view.ts
// =====================================

import { SYSTEM_REGISTRY } from "@/runtime/runtimeRegistry";
import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 TYPES
// =====================================

type View = {
  content: string;
  components: any[];
};

// =====================================
// 🧠 VIEW
// =====================================

export async function devpanelMainView(): Promise<View> {
  const lines: string[] = [];

  const buttons: any[] = [];

  for (const system of SYSTEM_REGISTRY) {
    const enabled = await isSystemEnabled(system.name);

    const status = enabled ? "🟢 ON" : "🔴 OFF";

    lines.push(`**${system.name}** → ${status}`);

    buttons.push({
      type: 2,
      label: `${system.name}`,
      style: enabled ? 3 : 2, // green / gray
      custom_id: `devpanel.toggle|system=${system.name}`,
    });
  }

  return {
    content: `⚙️ **Dev Panel**\n\n${lines.join("\n")}`,
    components: [
      {
        type: 1,
        components: buttons,
      },
    ],
  };
}
