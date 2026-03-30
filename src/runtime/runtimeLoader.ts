// =====================================
// 📁 src/runtime/systemLoader.ts
// =====================================

import { systems } from "./systemRegistry";
import { isSystemEnabled } from "./systemState";

import { log } from "@/core/logger/log";
import {
  createChildContext,
  TraceContext,
} from "@/core/trace/TraceContext";

import type { Client, Guild } from "discord.js";

// =============================
// 🔹 GLOBAL SYSTEMS
// =============================

export async function loadGlobalSystems(
  client: Client,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  for (const sys of systems) {
    if (sys.type !== "global") continue;

    const sysCtx = createChildContext(ctx, {
      system: sys.name,
    });

    const enabledState = await isSystemEnabled(sys.name, sysCtx);

    if (!enabledState.enabled) {
      log.ctx(sysCtx).event("system.skipped", {
        reason: enabledState.reason,
      });
      continue;
    }

    try {
      const mod = await sys.loader();

      if (typeof mod.initGlobal !== "function") {
        log.ctx(sysCtx).error("system.init.missing", {
          type: "global",
        });
        continue;
      }

      await mod.initGlobal(client, sysCtx);

      log.ctx(sysCtx).event("system.loaded");
    } catch (err) {
      log.ctx(sysCtx).error("system.load.failed", {
        error: err,
      });
    }
  }

  l.event("system.global.load.complete");
}

// =============================
// 🔹 GUILD SYSTEMS
// =============================

export async function loadGuildSystems(
  guild: Guild,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  for (const sys of systems) {
    if (sys.type !== "guild") continue;

    const sysCtx = createChildContext(ctx, {
      system: sys.name,
      guildId: guild.id,
    });

    const enabledState = await isSystemEnabled(sys.name, sysCtx);

    if (!enabledState.enabled) {
      log.ctx(sysCtx).event("system.skipped", {
        reason: enabledState.reason,
      });
      continue;
    }

    try {
      const mod = await sys.loader();

      if (typeof mod.initGuild !== "function") {
        log.ctx(sysCtx).error("system.init.missing", {
          type: "guild",
        });
        continue;
      }

      await mod.initGuild(guild, sysCtx);

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