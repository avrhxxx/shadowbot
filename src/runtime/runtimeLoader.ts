// =====================================
// 📁 src/runtime/runtimeLoader.ts
// =====================================

import { systems } from "./systemRegistry";
import { isSystemEnabled } from "./systemState";

import { log } from "@/core/logger/log";
import { createChildContext } from "@/core/trace/TraceContext";

import type { Client, Guild } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";

// =====================================
// 🔹 ERROR NORMALIZER
// =====================================

function normalizeError(err: unknown) {
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    message: String(err),
  };
}

// =====================================
// 🔹 INTERNAL EXECUTOR
// =====================================

async function executeSystem(
  target: Client | Guild,
  sys: (typeof systems)[number],
  ctx: TraceContext
) {
  const sysCtx = createChildContext(ctx, {
    system: sys.name,
    ...(target instanceof Object && "id" in target
      ? { guildId: (target as Guild).id }
      : {}),
  });

  const l = log.ctx(sysCtx);

  const enabledState = await isSystemEnabled(sys.name, sysCtx);

  if (!enabledState.enabled) {
    l.event("system.skipped", {
      reason: enabledState.reason,
    });
    return;
  }

  const start = Date.now();

  try {
    const mod = await sys.loader();

    if (typeof mod.init !== "function") {
      l.error("system.init.missing");
      return;
    }

    await mod.init(target, sysCtx);

    l.event("system.loaded", {
      durationMs: Date.now() - start,
    });
  } catch (err) {
    l.error("system.load.failed", {
      ...normalizeError(err),
    });
  }
}

// =====================================
// 🔹 GLOBAL SYSTEMS
// =====================================

export async function loadGlobalSystems(
  client: Client,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  for (const sys of systems) {
    if (sys.type !== "global") continue;

    await executeSystem(client, sys, ctx);
  }

  l.event("system.global.load.complete");
}

// =====================================
// 🔹 GUILD SYSTEMS
// =====================================

export async function loadGuildSystems(
  guild: Guild,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  for (const sys of systems) {
    if (sys.type !== "guild") continue;

    await executeSystem(guild, sys, ctx);
  }

  l.event("system.guild.load.complete", {
    guildId: guild.id,
  });
}