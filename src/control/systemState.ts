// src/control/systemState.ts

import { log } from "@/core/logger/log";
import { TraceContext } from "@/core/trace/TraceContext";

// =============================
// TYPES
// =============================

export type SystemName =
  | "moderator"
  | "events"
  | "points"
  | "translation"
  | "absence"
  | "quickadd";

interface SystemFlag {
  enabled: boolean;
  reason?: string;
}

// =============================
// INTERNAL STATE
// =============================

let globalEnabled = false; // 🔥 START: EVERYTHING OFF

const systemFlags: Record<SystemName, SystemFlag> = {
  moderator: { enabled: false },
  events: { enabled: false },
  points: { enabled: false },
  translation: { enabled: false },
  absence: { enabled: false },
  quickadd: { enabled: false },
};

// =============================
// GETTERS
// =============================

export function isGlobalEnabled(): boolean {
  return globalEnabled;
}

export function isSystemEnabled(name: SystemName): boolean {
  if (!globalEnabled) return false;
  return systemFlags[name]?.enabled ?? false;
}

export function getSystemState(name: SystemName): SystemFlag {
  return systemFlags[name];
}

// =============================
// SETTERS (RUNTIME CONTROL)
// =============================

export function setGlobalEnabled(
  value: boolean,
  ctx?: TraceContext
) {
  globalEnabled = value;

  if (ctx) {
    log.ctx(ctx).event("system_global_toggle", {
      enabled: value,
    });
  }
}

export function setSystemEnabled(
  name: SystemName,
  value: boolean,
  reason?: string,
  ctx?: TraceContext
) {
  systemFlags[name] = {
    enabled: value,
    reason,
  };

  if (ctx) {
    log.ctx(ctx).event("system_toggle", {
      system: name,
      enabled: value,
      reason,
    });
  }
}

// =============================
// BULK UPDATE (e.g. Sheets sync)
// =============================

export function setAllSystems(
  value: boolean,
  ctx?: TraceContext
) {
  for (const key of Object.keys(systemFlags) as SystemName[]) {
    systemFlags[key] = { enabled: value };
  }

  if (ctx) {
    log.ctx(ctx).event("system_toggle_all", {
      enabled: value,
    });
  }
}

// =============================
// DEBUG / SNAPSHOT
// =============================

export function getAllSystemStates() {
  return {
    globalEnabled,
    systems: { ...systemFlags },
  };
}