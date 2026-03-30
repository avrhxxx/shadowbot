// =====================================
// 📁 src/runtime/runtimeTypes.ts
// =====================================

import { Client, Guild } from "discord.js";

// =============================
// 🔹 SYSTEM NAME
// =============================

export type SystemName =
  | "moderator"
  | "events"
  | "points"
  | "translation"
  | "absence"
  | "quickadd";

// =============================
// 🔹 SYSTEM CONFIG (RUNTIME)
// =============================

export interface SystemConfig {
  system: SystemName;
  enabled: boolean;
  reason?: string;
}

// =============================
// 🔹 SYSTEM MODULE (DYNAMIC IMPORT)
// =============================

export interface SystemModule {
  init?: (target: Client | Guild, ctx: any) => Promise<void> | void;
}

// =============================
// 🔹 REGISTRY ENTRY
// =============================

export interface SystemRegistryEntry {
  name: SystemName;

  /**
   * fully typed dynamic loader
   */
  loader: () => Promise<SystemModule>;

  /**
   * execution type
   */
  type: "global" | "guild";
}