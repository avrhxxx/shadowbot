// =====================================
// 📁 src/core/router/systemRouter.ts
// =====================================

import { Interaction } from "discord.js";
import { createTraceId } from "../ids/IdGenerator";
import { logger } from "../logger/log";

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
  traceId: string
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
  const traceId = createTraceId();

  logger.emit({
    scope: "system.router",
    event: "received",
    traceId,
    context: {
      interactionId: interaction.id,
      type: interaction.type,
    },
  });

  for (const handler of SYSTEM_HANDLERS) {
    try {
      const handled = await handler(interaction, traceId);

      if (handled) {
        logger.emit({
          scope: "system.router",
          event: "handled",
          traceId,
          context: {
            handler: handler.name,
          },
        });

        return;
      }

    } catch (err) {
      logger.emit({
        scope: "system.router",
        event: "handler_error",
        traceId,
        level: "error",
        context: {
          handler: handler.name,
        },
        error: err,
      });
    }
  }

  logger.emit({
    scope: "system.router",
    event: "unhandled",
    traceId,
    level: "warn",
    context: {
      interactionId: interaction.id,
    },
  });
}