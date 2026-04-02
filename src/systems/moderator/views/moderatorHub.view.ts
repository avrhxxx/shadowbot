// =====================================
// 📁 src/systems/moderator/views/moderatorHub.view.ts
// =====================================

import type { ViewResult } from "@/core/ui/uiEngine";
import { isSystemEnabled } from "@/runtime/runtimeState";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// =====================================
// 🔹 HUB VIEW
// =====================================

export async function renderModeratorHub(): Promise<ViewResult> {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  const systems = [
    { name: "events", label: "Event Menu" },
    { name: "points", label: "Points Menu" },
    { name: "absence", label: "Absence Menu" },
    { name: "quickadd", label: "QuickAdd Menu" },
  ];

  const buttons: ButtonBuilder[] = [];

  for (const sys of systems) {
    const enabled = await isSystemEnabled(sys.name);
    if (!enabled) continue;

    buttons.push(
      new ButtonBuilder()
        .setCustomId(`moderator.open|target=${sys.name}`)
        .setLabel(sys.label)
        .setStyle(ButtonStyle.Primary)
    );
  }

  // 🔹 HELP (zawsze)
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`moderator.open|target=help`)
      .setLabel("Help")
      .setStyle(ButtonStyle.Secondary)
  );

  // 🔹 podział na rzędy (max 5)
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttons.slice(i, i + 5)
      )
    );
  }

  return {
    content: `📌 **Moderator Panel**\n\nSelect an option:`,
    components: rows,
  };
}