// =====================================
// 📁 src/runtime/runtimeTypes.ts
// =====================================

import { Client, Guild } from "discord.js";
import type { TraceContext } from "@/core/trace/TraceContext";

// =============================
// 🔹 SYSTEM NAME
// =============================

export type SystemName =
  | "moderator"
  | "events"
  | "points"
  | "translation"
  | "absence"
  | "quickadd"
  | "quickadd_worker";

// =============================
// 🔹 RUNTIME KEY (INTERNAL)
// =============================

export type RuntimeKey = SystemName | "__global__";

// =============================
// 🔹 SYSTEM MODULE (DYNAMIC IMPORT)
// =============================

export interface SystemModule {
  init?: (
    target: Client | Guild,
    ctx: TraceContext
  ) => Promise<void> | void;
}

// =============================
// 🔹 REGISTRY ENTRY
// =============================

export interface SystemRegistryEntry {
  name: SystemName;

  loader: () => Promise<SystemModule>;

  type: "global" | "guild";
}