// =====================================
// 📁 src/ui/devpanel/devpanel.view.ts
// =====================================

import { SYSTEM_REGISTRY } from "@/runtime/runtimeRegistry";
import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 TYPES
// =====================================

type ViewResult = {
  content: string;
  components: any[];
};

// =====================================
// 🧠 VIEW: MAIN
// =====================================

export async function devpanelMainView(): Promise<ViewResult> {
  const rows: any[] = [];

  const lines: string[] = [];

  for (const system of SYSTEM_REGISTRY) {
    const enabled = await isSystemEnabled(system.name);

    const status = enabled ? "🟢 ENABLED" : "🔴 DISABLED";

    lines.push(`**${system.name}** → ${status}`);

    rows.push({
      type: 1,
      components: [
        {
          type: 2,
          style: enabled ? 4 : 3, // danger / success
          label: enabled ? "Disable" : "Enable",
          custom_id: `devpanel.toggle:${system.name}`,
        },
      ],
    });
  }

  return {
    content: `# 🛠️ Dev Panel\n\n${lines.join("\n")}`,
    components: rows,
  };
}