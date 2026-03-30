// src/control/systemLoader.ts

import { Client } from "discord.js";
import { TraceContext } from "@/core/trace/TraceContext";
import { log } from "@/core/logger/log";
import {
  isSystemEnabled,
  isGlobalEnabled,
  SystemName,
} from "./systemState";

// =============================
// TYPES
// =============================

type SystemInit = (client: Client, ctx: TraceContext) => Promise<void>;

interface SystemDefinition {
  name: SystemName;
  loader: () => Promise<{ init: SystemInit }>;
}

// =============================
// SYSTEM REGISTRY (DYNAMIC)
// =============================

const systems: SystemDefinition[] = [
  {
    name: "moderator",
    loader: async () => {
      const mod = await import("@/system/moderator/moderatorPanel");
      return { init: mod.initModeratorPanel };
    },
  },
  {
    name: "events",
    loader: async () => {
      const mod = await import("@/system/events");
      return { init: mod.initEventsSystem }; // ⚠️ dopasujesz nazwę
    },
  },
  {
    name: "points",
    loader: async () => {
      const mod = await import("@/system/points");
      return { init: mod.initPointsSystem };
    },
  },
  {
    name: "translation",
    loader: async () => {
      const mod = await import("@/system/translation");
      return { init: mod.initTranslationSystem };
    },
  },
  {
    name: "absence",
    loader: async () => {
      const mod = await import("@/system/absence");
      return { init: mod.initAbsenceSystem };
    },
  },
  {
    name: "quickadd",
    loader: async () => {
      const mod = await import("@/system/quickadd");
      return { init: mod.initQuickAddSystem };
    },
  },
];

// =============================
// LOADER
// =============================

export async function loadSystems(
  client: Client,
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  if (!isGlobalEnabled()) {
    l.warn("systems_global_disabled", {});
    return;
  }

  l.event("systems_loading_start", {
    total: systems.length,
  });

  for (const system of systems) {
    const childCtx = ctx; // 🔥 możesz później zrobić createChildContext

    if (!isSystemEnabled(system.name)) {
      l.debug("system_skipped", {
        system: system.name,
      });
      continue;
    }

    try {
      l.event("system_loading", {
        system: system.name,
      });

      const mod = await system.loader();

      if (!mod.init) {
        throw new Error(`System ${system.name} has no init`);
      }

      await mod.init(client, childCtx);

      l.event("system_loaded", {
        system: system.name,
      });

    } catch (error) {
      l.error("system_load_error", {
        system: system.name,
        error,
      });
    }
  }

  l.event("systems_loading_complete", {});
}