// =====================================
// 📁 src/core/router/systemRouter.ts
// =====================================

import { Interaction } from "discord.js";
import {
  createTraceId,
  createCorrelationId,
  createFlowId,
  createInteractionId,
} from "../ids/IdGenerator";
import { log } from "../logger/log";
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

type SystemHandlerEntry = {
  name: TraceContext["system"];
  handler: SystemHandler;
};

// =============================
// 🧩 REGISTRY
// =============================

const SYSTEM_HANDLERS: SystemHandlerEntry[] = [
  { name: "events", handler: handleEventInteraction },
  { name: "absence", handler: handleAbsenceInteraction },
  { name: "points", handler: handlePointsInteraction },
];

// =============================
// 🚀 ROUTER
// =============================

export async function handleSystemInteraction(
  interaction: Interaction
) {
  const traceId = createTraceId();
  const correlationId = createCorrelationId();
  const flowId = createFlowId();
  const interactionId = createInteractionId();

  const baseCtx: TraceContext = {
    traceId,
    correlationId,
    flowId,
    interactionId,
    source: "discord",
    userId: interaction.isRepliable() ? interaction.user.id : undefined,
    guildId: interaction.guildId ?? undefined,
    channelId: interaction.channelId ?? undefined,
  };

  const l = log.ctx(baseCtx);

  l.event("interaction.received", {
    eventType: "interaction",
    flow: { step: "router:start" },
  });

  for (const { name, handler } of SYSTEM_HANDLERS) {
    const startTime = Date.now();

    const ctx: TraceContext = {
      ...baseCtx,
      system: name,
    };

    const l = log.ctx(ctx);

    try {
      l.event("handler.attempt", {
        eventType: "system",
      });

      const handled = await handler(interaction, ctx);

      l.event("handler.result", {
        eventType: "system",
        decision: {
          condition: "handler_returned_true",
          result: handled,
        },
      });

      if (handled) {
        l.event("handler.handled", {
          eventType: "system",
          timing: {
            label: name!,
            durationMs: Date.now() - startTime,
          },
        });

        return;
      }
    } catch (err) {
      l.error("handler.error", err, {
        eventType: "system",
        timing: {
          label: name!,
          durationMs: Date.now() - startTime,
        },
      });
    }
  }

  const lFinal = log.ctx(baseCtx);

  lFinal.warn("interaction.unhandled", {
    eventType: "interaction",
    flow: { step: "router:end" },
  });
}