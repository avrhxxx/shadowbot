// =====================================
// 📁 src/systems/moderator/views/moderator.view.ts
// =====================================

import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 TYPES
// =====================================

type View = {
  content: string;
  components: any[];
};

type ModeratorSystem = {
  name: string;
  label: string;
};

// =====================================
// 🧠 MAIN VIEW
// =====================================

export async function renderModeratorHub(): Promise<View> {
  const systems: ModeratorSystem[] = [
    { name: "events", label: "Event Menu" },
    { name: "points", label: "Points Menu" },
    { name: "absence", label: "Absence Menu" },
    { name: "quickadd", label: "QuickAdd Menu" },
  ];

  const buttons: any[] = [];

  for (const sys of systems) {
    const enabled = await isSystemEnabled(sys.name);
    if (!enabled) continue;

    buttons.push({
      type: 2, // button
      label: sys.label,
      style: 1, // primary
      custom_id: `moderator.open|target=${sys.name}`,
    });
  }

  // 🔹 HELP (zawsze)
  buttons.push({
    type: 2,
    label: "Help",
    style: 2, // secondary
    custom_id: `moderator.open|target=help`,
  });

  return {
    content: `📌 **Moderator Panel**\n\nSelect an option:`,
    components: [
      {
        type: 1, // action row
        components: buttons.slice(0, 5), // max 5 per row
      },
      ...(buttons.length > 5
        ? [
            {
              type: 1,
              components: buttons.slice(5, 10),
            },
          ]
        : []),
    ],
  };
}