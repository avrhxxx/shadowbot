// =====================================
// 📁 src/runtime/runtimeTypes.ts
// =====================================

import { Client } from "discord.js";

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
  init?: (client: Client) => Promise<void> | void;
}

// =============================
// 🔹 REGISTRY ENTRY
// =============================

export interface SystemRegistryEntry {
  name: SystemName;

  // lazy loader (dynamic import)
  loader: () => Promise<SystemModule>;
}
