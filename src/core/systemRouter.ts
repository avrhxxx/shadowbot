// =====================================
// 📁 src/core/systemRouter.ts
// =====================================

import { Interaction } from "discord.js";

// =============================
// 🧩 SYSTEM IMPORTS
// =============================

import { handleEventInteraction } from "../system/events";
import { handleAbsenceInteraction } from "../system/absence";
import { handlePointsInteraction } from "../system/points";

// =============================
// 🧠 TYPES
// =============================

type SystemHandler = (interaction: Interaction) => Promise<boolean>;

// =============================
// 🧩 REGISTRY
// =============================

const SYSTEM_HANDLERS: SystemHandler[] = [
  handleEventInteraction,
  handleAbsenceInteraction,
  handlePointsInteraction,
];

// =============================
// 🚀 ROUTER
// =============================

export async function handleSystemInteraction(
  interaction: Interaction
) {
  for (const handler of SYSTEM_HANDLERS) {
    try {
      const handled = await handler(interaction);
      if (handled) return;
    } catch (err) {
      console.error("❌ System handler error:", err);
    }
  }
}


mam taki aktualny