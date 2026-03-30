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
import { TraceContext, createChildContext } from "../trace/TraceContext";

import { handleEventInteraction } from "../../system/events";
import { handleAbsenceInteraction } from "../../system/absence";
import { handlePointsInteraction } from "../../system/points";

type SystemHandler = (
  interaction: Interaction,
  ctx: TraceContext
) => Promise<boolean>;

const SYSTEM_HANDLERS: { name: TraceContext["system"]; handler: SystemHandler }[] = [
  { name: "events", handler: handleEventInteraction },
  { name: "absence", handler: handleAbsenceInteraction },
  { name: "points", handler: handlePointsInteraction },
];

export async function handleSystemInteraction(interaction: Interaction) {
  const baseCtx: TraceContext = {
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),
    interactionId: createInteractionId(),
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
    const start = Date.now();

    const ctx = createChildContext(baseCtx, { system: name });
    const l = log.ctx(ctx);

    try {
      l.event("handler.attempt");

      const handled = await handler(interaction, ctx);

      l.event("handler.result", {
        decision: { condition: "handler_returned_true", result: handled },
      });

      if (handled) {
        l.event("handler.handled", {
          timing: { label: name!, durationMs: Date.now() - start },
        });
        return;
      }
    } catch (err) {
      l.error("handler.error", err);
    }
  }

  log.ctx(baseCtx).warn("interaction.unhandled");
}