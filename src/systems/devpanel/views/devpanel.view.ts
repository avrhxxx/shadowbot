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
// 🧠 MAIN VIEW
// =====================================

export async function devpanelMainView(): Promise<View> {
  return {
    content: `⚙️ **Dev Panel**\n\nSelect category:`,

    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Systems",
            style: 1,
            custom_id: "devpanel.systems",
          },
        ],
      },
    ],
  };
}

// =====================================
// 🧠 SYSTEMS VIEW
// =====================================

export async function devpanelSystemsView(): Promise<View> {
  const lines: string[] = [];
  const buttons: any[] = [];

  for (const system of SYSTEM_REGISTRY) {
    // 🔥 ukrywamy devpanel
    if (system.name === "devpanel") continue;

    const enabled = await isSystemEnabled(system.name);

    const status = enabled ? "🟢 ON" : "🔴 OFF";

    lines.push(`**${system.name}** → ${status}`);

    buttons.push({
      type: 2,
      label: `${system.name}`,
      style: enabled ? 3 : 2,
      custom_id: `devpanel.toggle|system=${system.name}`,
    });
  }

  return {
    content: `⚙️ **Dev Panel → Systems**\n\n${lines.join("\n")}`,

    components: [
      {
        type: 1,
        components: buttons,
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "⬅ Back",
            style: 2,
            custom_id: "devpanel.back",
          },
        ],
      },
    ],
  };
}