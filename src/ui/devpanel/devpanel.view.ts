// =====================================
// 📁 src/ui/devpanel/devpanel.view.ts
// =====================================

import { SYSTEM_REGISTRY } from "@/runtime/runtimeRegistry";
import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 TYPES
// =====================================

type Button = {
  label: string;
  style?: "primary" | "secondary" | "danger";
  customId: string;
};

type View = {
  content: string;
  components: any[];
};

// =====================================
// 🧠 MAIN VIEW
// =====================================

export async function devpanelMainView(): Promise<View> {
  const systems = SYSTEM_REGISTRY;

  const buttons: Button[] = [];

  for (const system of systems) {
    const enabled = await isSystemEnabled(system.name);

    buttons.push({
      label: `${system.name} → ${
        enabled ? "🟢 ON" : "🔴 OFF"
      }`,
      style: enabled ? "primary" : "secondary",
      customId: JSON.stringify({
        action: "devpanel.toggle",
        payload: { system: system.name },
      }),
    });
  }

  return {
    content: "🧠 **Dev Panel — System Control**",
    components: [
      {
        type: 1,
        components: buttons.map((b) => ({
          type: 2,
          label: b.label,
          style: mapStyle(b.style),
          custom_id: b.customId,
        })),
      },
    ],
  };
}

// =====================================
// 🔧 STYLE MAP
// =====================================

function mapStyle(style?: string) {
  switch (style) {
    case "secondary":
      return 2;
    case "danger":
      return 4;
    default:
      return 1;
  }
}