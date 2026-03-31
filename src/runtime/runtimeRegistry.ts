// =====================================
// 📁 src/runtime/runtimeRegistry.ts
// =====================================

/**
 * 🧠 ROLE:
 * Rejestr wszystkich systemów runtime
 *
 * INPUT:
 * - brak (statyczny config)
 *
 * OUTPUT:
 * - lista systemów do uruchomienia
 */

import type { SystemRegistryEntry } from "./runtimeTypes";

// =====================================
// 🔹 REGISTRY
// =====================================

export const SYSTEM_REGISTRY: SystemRegistryEntry[] = [
  {
    name: "moderator",
    type: "guild",
    loader: () => import("../systems/moderator/index.js"),
  },
  {
    name: "events",
    type: "guild",
    loader: () => import("../systems/events/index.js"),
  },
  {
    name: "absence",
    type: "guild",
    loader: () => import("../systems/absence/index.js"),
  },
  {
    name: "points",
    type: "guild",
    loader: () => import("../systems/points/index.js"),
  },
  {
    name: "quickadd",
    type: "global",
    loader: () => import("../systems/quickadd/index.js"),
  },
  {
    name: "quickadd_worker",
    type: "global",
    loader: () => import("../systems/quickadd/worker.js"),
  },
];