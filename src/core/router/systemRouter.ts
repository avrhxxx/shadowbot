// =====================================
// 📁 src/core/router/systemRouter.ts
// =====================================

import { Interaction } from "discord.js";
import { createRootContext, createChildContext } from "../trace/TraceContext";
import { log } from "../logger/log";

import { handleEventInteraction } from "../../system/events";
import { handleAbsenceInteraction } from "../../system/absence";
import { handlePointsInteraction } from "../../system/points";

const SYSTEM_HANDLERS = [
  { name: "events", handler: handleEventInteraction },
  { name: "absence", handler: handleAbsenceInteraction },
  { name: "points", handler: handlePointsInteraction },
] as const;

export async function handleSystemInteraction(
  interaction: Interaction
) {
  const baseCtx = createRootContext({
    source: "discord",
    userId: interaction.isRepliable() ? interaction.user.id : undefined,
    guildId: interaction.guildId ?? undefined,
    channelId: interaction.channelId ?? undefined,
  });

  const l = log.ctx(baseCtx);

  l.event("interaction.received", {
    eventType: "interaction",
    flow: { step: "router:start" },
  });

  for (const { name, handler } of SYSTEM_HANDLERS) {
    const startTime = Date.now();

    const ctx = createChildContext(baseCtx, { system: name });
    const l = log.ctx(ctx);

    try {
      l.event("handler.attempt", {
        eventType: "system",
        flow: { step: `router:handler:${name}` },
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
          result: { handled: true },
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

  log.ctx(baseCtx).warn("interaction.unhandled", {
    eventType: "interaction",
  });
}