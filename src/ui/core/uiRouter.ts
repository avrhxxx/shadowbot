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
// 🔹 EXECUTE (🔥 CENTRAL LOGIC)
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
    // system OFF → blokujemy akcję
    return true;
  }

  await action.handler(interaction, ctx, payload);

  return true;
}

// =====================================
// 🔹 PARSE (🔥 FIXED FORMAT)
// =====================================

export function parseCustomId(customId: string): {
  action: string;
  payload?: Record<string, string>;
} {
  // 🔹 FORMAT: action|key=value|key=value

  const [action, ...parts] = customId.split("|");

  if (parts.length === 0) {
    return { action };
  }

  const payload: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split("=");

    if (key && value) {
      payload[key] = value;
    }
  }

  return { action, payload };
}