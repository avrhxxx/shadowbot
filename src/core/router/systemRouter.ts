// =====================================
// 📁 src/core/router/systemRouter.ts
// =====================================

import { Interaction } from "discord.js";
import { createTraceId } from "../ids/IdGenerator";
import { TraceContext } from "../trace/TraceContext";
import { log } from "../logger/log";

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

  log(ctx, "system_router_received", {
    context: {
      interactionId: interaction.id,
      type: interaction.type,
    },
  });

  for (const handler of SYSTEM_HANDLERS) {
    try {
      const handled = await handler(interaction, ctx);

      if (handled) {
        log(ctx, "system_router_handled", {
          context: {
            handler: handler.name,
          },
        });

        return;
      }

    } catch (err) {
      log(ctx, "system_router_error", {
        context: {
          handler: handler.name,
        },
        error: err,
      }, "error");
    }
  }

  log(ctx, "system_router_unhandled", {
    context: {
      interactionId: interaction.id,
    },
  }, "warn");
}