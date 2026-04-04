// =====================================
// 📁 src/ui/core/uiRouter.ts
// =====================================

import type { TraceContext } from "@/trace";

// =====================================
// 🔹 TYPES
// =====================================

export type UIContext = { renderView: Function; showModal: Function; navigate: Function };
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