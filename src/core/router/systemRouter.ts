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
// 🔧 CONTEXT BUILDER
// =============================

function createContext(interaction: Interaction): TraceContext {
  return {
    traceId: createTraceId(),
    userId: interaction.user?.id,
    source: "discord",
  };
}

// =============================
// 🚀 ROUTER
// =============================

export async function handleSystemInteraction(
  interaction: Interaction
) {
  const ctx = createContext(interaction);

  // 🔹 TEMP DEBUG (docelowo → logger)
  console.log(`➡️ ROUTE ${interaction.id} | trace=${ctx.traceId}`);

  for (const handler of SYSTEM_HANDLERS) {
    try {
      const handled = await handler(interaction, ctx);

      if (handled) {
        // 🔹 DEBUG SUCCESS FLOW
        console.log(`✅ HANDLED by ${handler.name} | trace=${ctx.traceId}`);
        return;
      }

    } catch (err) {
      console.error(
        `❌ System handler error (${handler.name}) | trace=${ctx.traceId}`,
        err
      );
    }
  }

  // 🔹 OPTIONAL: nic nie obsłużyło
  console.log(`⚠️ UNHANDLED interaction | trace=${ctx.traceId}`);
}