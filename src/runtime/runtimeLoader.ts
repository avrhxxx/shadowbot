// =====================================
// 📁 src/runtime/systemLoader.ts
// =====================================

/**
 * 🧠 ROLE:
 * Runtime system loader (execution layer)
 *
 * Responsibilities:
 * - check system flags (enabled/disabled)
 * - dynamically load modules
 * - execute init functions
 * - isolate failures (never crash app)
 *
 * ❗ RULES:
 * - MUST respect systemState
 * - MUST NOT throw (log only)
 * - MUST isolate broken systems
 */

import { systems } from "./systemRegistry";
import { isSystemEnabled } from "./systemState";

import { log } from "@/core/logger/log";
import {
  createChildContext,
  TraceContext,
} from "@/core/trace/TraceContext";

import type { Client, Guild } from "discord.js";

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

    const sysCtx = createChildContext(ctx, {
      system: sys.id,
    });

    const enabledState = await isSystemEnabled(sys.id);

    if (!enabledState.enabled) {
      log.ctx(sysCtx).event("system.skipped", {
        reason: enabledState.reason,
      });
      continue;
    }

    try {
      const mod = await sys.loader();

      const initFn = mod[sys.init];

      if (typeof initFn !== "function") {
        log.ctx(sysCtx).error("system.init.missing", {
          init: sys.init,
        });
        continue;
      }

      await initFn(client, sysCtx);

      log.ctx(sysCtx).event("system.loaded");
    } catch (err) {
      log.ctx(sysCtx).error("system.load.failed", {
        error: err,
      });
    }
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

    const sysCtx = createChildContext(ctx, {
      system: sys.id,
      guildId: guild.id,
    });

    const enabledState = await isSystemEnabled(sys.id);

    if (!enabledState.enabled) {
      log.ctx(sysCtx).event("system.skipped", {
        reason: enabledState.reason,
      });
      continue;
    }

    try {
      const mod = await sys.loader();

      const initFn = mod[sys.init];

      if (typeof initFn !== "function") {
        log.ctx(sysCtx).error("system.init.missing", {
          init: sys.init,
        });
        continue;
      }

      await initFn(guild, sysCtx);

      log.ctx(sysCtx).event("system.loaded");
    } catch (err) {
      log.ctx(sysCtx).error("system.load.failed", {
        error: err,
      });
    }
  }

  l.event("system.guild.load.complete", {
    guildId: guild.id,
  });
}
