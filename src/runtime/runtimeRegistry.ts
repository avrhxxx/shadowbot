// =====================================
// 📁 src/runtime/systemRegistry.ts
// =====================================

import { SystemRegistryEntry } from "./runtimeTypes";

// =============================
// 🔹 REGISTRY
// =============================

export const systems: SystemRegistryEntry[] = [
  {
    name: "moderator",
    loader: () => import("@/system/moderator"),
    type: "global",
  },
  {
    name: "translation",
    loader: () => import("@/system/translation"),
    type: "global",
  },
  {
    name: "events",
    loader: () => import("@/system/events"),
    type: "guild",
  },
  {
    name: "absence",
    loader: () => import("@/system/absence"),
    type: "guild",
  },
  {
    name: "quickadd",
    loader: () => import("@/system/quickadd"),
    type: "global",
  },
];