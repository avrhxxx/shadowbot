// =====================================
// 📁 src/ui/core/uiRouter.ts
// =====================================

import type { Interaction } from "discord.js";
import type { TraceContext } from "@/trace";

import { isSystemEnabled } from "@/runtime/runtimeState";

// =====================================
// 🔹 TYPES
// =====================================

export type UIContext = {
  renderView: (viewId: string, state?: any) => Promise<any>;
  showModal?: (modal: any, payload?: any) => Promise<any>;
  navigate?: (destination: string, options?: any) => Promise<void>;
};

export type UIActionHandler = (ctx: UIContext, payload?: any) => Promise<void>;
export type UIActionDefinition = { system: string; handler: UIActionHandler };

// =====================================
// 🔹 REGISTRY
// =====================================

const registry = new Map<string, UIActionDefinition>();

export function registerUIAction(id: string, def: UIActionDefinition) {
  registry.set(id, def);
}

// =====================================
// 🔹 EXECUTE
// =====================================

export async function executeUIAction(id: string, ctx: UIContext, payload?: any): Promise<boolean> {
  const action = registry.get(id);
  if (!action) return false;
  const enabled = await isSystemEnabled(action.system);
  if (!enabled) return true;
  await action.handler(ctx, payload);
  return true;
}

// =====================================
// 🔹 PARSE CUSTOM ID
// =====================================

export function parseCustomId(customId: string): { action: string; payload?: Record<string, string> } {
  const [action, ...parts] = customId.split("|");
  if (!parts.length) return { action };
  const payload: Record<string, string> = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) payload[key] = value;
  }
  return { action, payload };
}