// =====================================
// 📁 src/runtime/systemRegistry.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central registry of all systems (dynamic loading)
 *
 * Responsibilities:
 * - define system list
 * - provide dynamic import loaders
 * - map system → init function
 *
 * ❗ RULES:
 * - NO static imports of systems
 * - ONLY dynamic imports
 * - NO logic (data only)
 */

import type { Client } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";

// =====================================
// 🔹 TYPES
// =====================================

export type SystemDefinition = {
  id: string;

  /**
   * dynamic module loader
   */
  loader: () => Promise<any>;

  /**
   * function name to call after load
   */
  init: string;

  /**
   * init type (for future extensibility)
   */
  type: "global" | "guild";
};

// =====================================
// 🔹 REGISTRY
// =====================================

export const systems: SystemDefinition[] = [
  {
    id: "moderator",
    loader: () => import("@/system/moderator"),
    init: "initModeratorPanel",
    type: "global",
  },
  {
    id: "translation",
    loader: () => import("@/system/translation"),
    init: "initTranslationModule",
    type: "global",
  },
  {
    id: "events",
    loader: () => import("@/system/events"),
    init: "initEventReminders",
    type: "guild",
  },
  {
    id: "absence",
    loader: () => import("@/system/absence"),
    init: "initAbsenceNotifications",
    type: "guild",
  },
  {
    id: "quickadd",
    loader: () => import("@/system/quickadd"),
    init: "registerQuickAddListener",
    type: "global",
  },
];
