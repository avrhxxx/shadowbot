// =====================================
// 📁 src/ui/core/uiRouter.ts
// =====================================

import type { Interaction } from "discord.js";
import type { TraceContext } from "@/trace";

import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 TYPES
// =====================================

export type UIActionHandler = (
  interaction: Interaction,
  ctx: TraceContext,
  payload?: any
) => Promise<void>;

export type UIActionDefinition = {
  system: string;
  handler: UIActionHandler;
};

type Registry = Map<string, UIActionDefinition>;

// =====================================
// 🔹 REGISTRY
// =====================================

const registry: Registry = new Map();

// =====================================
// 🔹 REGISTER
// =====================================

export function registerUIAction(
  id: string,
  def: UIActionDefinition
) {
  registry.set(id, def);
}

// =====================================
// 🔹 EXECUTE (🔥 NOWE)
// =====================================

export async function executeUIAction(
  id: string,
  interaction: Interaction,
  ctx: TraceContext,
  payload?: any
): Promise<boolean> {
  const action = registry.get(id);

  if (!action) return false;

  const enabled = await isSystemEnabled(action.system);

  if (!enabled) {
    // system OFF → blokujemy
    return true;
  }

  await action.handler(interaction, ctx, payload);

  return true;
}

// =====================================
// 🔹 PARSE
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