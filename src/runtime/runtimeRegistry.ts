// =====================================
// 📁 src/runtime/runtimeRegistry.ts
// =====================================

import type { SystemRegistryEntry } from "./runtimeTypes";

// =====================================
// 🔹 SOURCE OF TRUTH (ONLY EDIT THIS)
// =====================================

export const SYSTEM_NAMES = [
  "devpanel",
  "translation",
  "events",
  "points",
  "absence",
  "quickadd",
  "moderator", // <- dodany
] as const;

// 🔥 FIX: fallback do string
export type SystemName =
  (typeof SYSTEM_NAMES)[number] extends never
    ? string
    : (typeof SYSTEM_NAMES)[number];

// =====================================
// 🔹 HELPERS
// =====================================

function resolveSystemType(name: SystemName): "global" | "guild" {
  if (name.includes("worker")) return "global";
  return "guild";
}

function buildPath(name: SystemName): string {
  return `../systems/${name}/index.js`;
}

// =====================================
// 🔹 BUILD REGISTRY (AUTO)
// =====================================

export const SYSTEM_REGISTRY: SystemRegistryEntry[] = SYSTEM_NAMES.map(
  (name) => ({
    name,
    type: resolveSystemType(name),
    loader: () => import(buildPath(name)),
  })
);