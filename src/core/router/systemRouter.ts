// =====================================
// 📁 src/core/router/systemRouter.ts
// =====================================

import { Interaction } from "discord.js";
import { createTraceId } from "../ids/IdGenerator";
import { TraceContext } from "../trace/TraceContext";

// =============================
// 🧩 SYSTEM IMPORTS
// =============================

import { handleEventInteraction } from "../../system/events";
import { handleAbsenceInteraction } from "../../system/absence";
import { handlePointsInteraction } from "../../system/points";

// =============================
// 🧠 TYPES
// =============================

type SystemHandler = (
  interaction: Interaction,
  ctx: TraceContext
) => Promise<boolean>;

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
  const ctx: TraceContext = {
    traceId: createTraceId(),
    userId: interaction.user?.id,
    source: "discord",
  };

  console.log(`➡️ ROUTE ${interaction.id} | ${ctx.traceId}`);

  for (const handler of SYSTEM_HANDLERS) {
    try {
      const handled = await handler(interaction, ctx);
      if (handled) return;
    } catch (err) {
      console.error("❌ System handler error:", err);
    }
  }
}