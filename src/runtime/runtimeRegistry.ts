// =====================================
// 📁 src/runtime/runtimeRegistry.ts
// =====================================

/**
 * 🧠 ROLE:
 * Auto-build system registry from simple list
 *
 * 📥 INPUT:
 * - list of system names
 *
 * 📤 OUTPUT:
 * - full SYSTEM_REGISTRY with loaders
 *
 * ❗ GOAL:
 * - ZERO duplication
 * - ONE place to register systems
 * - NO manual loaders
 */

// =====================================
// 🔹 TYPES
// =====================================

import type { SystemRegistryEntry } from "./runtimeTypes";

// =====================================
// 🔹 SOURCE OF TRUTH (ONLY EDIT THIS)
// =====================================

const SYSTEM_NAMES = [
  // 👇 dodajesz tylko tutaj
  // "moderator",
  // "events",
  // "absence",
];

// =====================================
// 🔹 HELPERS
// =====================================

function resolveSystemType(name: string): "global" | "guild" {
  // 🔥 możesz to później rozbudować
  if (name.includes("worker")) return "global";

  return "guild";
}

function buildPath(name: string): string {
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