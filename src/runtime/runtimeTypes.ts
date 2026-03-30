// =====================================
// 📁 src/runtime/runtimeTypes.ts
// =====================================

import { Client, Guild } from "discord.js";
import { TraceContext } from "@/core/trace/TraceContext";

// =============================
// 🔹 SYSTEM NAME (SOURCE OF TRUTH)
// =============================

export type SystemName =
  | "moderator"
  | "events"
  | "points"
  | "translation"
  | "absence"
  | "quickadd";

// =============================
// 🔹 SYSTEM STATE
// =============================

export interface SystemStateEntry {
  enabled: boolean;
  reason?: string;
}

// =============================
// 🔹 SYSTEM MODULE CONTRACT
// =============================

export type GlobalSystemModule = {
  initGlobal: (client: Client, ctx: TraceContext) => Promise<void> | void;
};

export type GuildSystemModule = {
  initGuild: (guild: Guild, ctx: TraceContext) => Promise<void> | void;
};

export type SystemModule = Partial<
  GlobalSystemModule & GuildSystemModule
>;

// =============================
// 🔹 REGISTRY ENTRY
// =============================

export interface SystemRegistryEntry {
  name: SystemName;

  loader: () => Promise<SystemModule>;

  type: "global" | "guild";
}