// =====================================
// 📁 src/core/router/systemRouter.ts
// =====================================

import { Interaction } from "discord.js";
import { createTraceId } from "../ids/IdGenerator";
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

  // 🔥 BASE CTX
  const baseCtx: TraceContext = {
    traceId,
    source: "discord",
    userId: interaction.isRepliable() ? interaction.user.id : undefined,
    guildId: interaction.guildId ?? undefined,
  };

  const l = log.ctx(baseCtx);

  l.event("received", {
    input: {
      interactionId: interaction.id,
      type: interaction.type,
    },
  });

  for (const { name, handler } of SYSTEM_HANDLERS) {
    const startTime = Date.now();

    // 🔁 CHILD CTX (per system)
    const ctx: TraceContext = {
      ...baseCtx,
      system: name,
    };

    const l = log.ctx(ctx);

    try {
      l.event("handler_attempt");

      const handled = await handler(interaction, ctx);

      if (handled) {
        l.event("handled", {
          result: { handled: true },
          timing: {
            label: name!,
            durationMs: Date.now() - startTime,
          },
        });

        return;
      }
    } catch (err) {
      l.error("handler_error", err, {
        timing: {
          label: name!,
          durationMs: Date.now() - startTime,
        },
      });
    }
  }

  const lFinal = log.ctx(baseCtx);

  lFinal.warn("unhandled", {
    input: {
      interactionId: interaction.id,
      type: interaction.type,
      ...(interaction.isButton() && { customId: interaction.customId }),
      ...(interaction.isStringSelectMenu() && { customId: interaction.customId }),
      ...(interaction.isModalSubmit() && { customId: interaction.customId }),
    },
  });
}