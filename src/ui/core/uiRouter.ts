// =====================================
// 📁 src/ui/core/uiRouter.ts
// =====================================

import type { Interaction } from "discord.js";
import type { TraceContext } from "@/trace";

// =====================================
// 🔹 TYPES
// =====================================

export type UIActionHandler = (
  interaction: Interaction,
  ctx: TraceContext,
  payload?: any
) => Promise<void>;

type Registry = Map<string, UIActionHandler>;

// =====================================
// 🔹 REGISTRY
// =====================================

const registry: Registry = new Map();

// =====================================
// 🔹 REGISTER
// =====================================

export function registerUIAction(
  id: string,
  handler: UIActionHandler
) {
  registry.set(id, handler);
}

// =====================================
// 🔹 RESOLVE
// =====================================

export function getUIAction(id: string) {
  return registry.get(id);
}

// =====================================
// 🔹 PARSE (🔥 MAGIC)
// =====================================

export function parseCustomId(customId: string): {
  action: string;
  payload?: any;
} {
  try {
    const parsed = JSON.parse(customId);
    return parsed;
  } catch {
    return { action: customId };
  }
}