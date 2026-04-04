// =====================================
// 📁 src/ui/engine/router.ts
// =====================================

/**
 * 🧠 ROLE:
 * UI Router (internal)
 *
 * - resolve customId → action
 * - execute handler
 * - zarządza lifecycle interakcji
 * - współpracuje z UI API (interaction.*)
 *
 * ❗ INTERNAL ONLY
 */

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

import { uiStore } from "../store/uiStore";

// =====================================
// 🔹 TYPES
// =====================================

type UIActionHandler = (
  ctx: TraceContext,
  state?: any
) => Promise<void>;

type UIActionDefinition = {
  id: string;
  system: string;
  handler: UIActionHandler;
};

// =====================================
// 🔹 REGISTRY
// =====================================

const actions = new Map<string, UIActionDefinition>();

export function registerAction(def: UIActionDefinition) {
  actions.set(def.id, def);
}

// =====================================
// 🔹 EXECUTE ACTION
// =====================================

export async function executeAction(
  ctx: TraceContext,
  customId: string
): Promise<boolean> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.router");

  flow.start({ meta: { customId } });

  const entry = uiStore.get(customId);

  if (!entry) {
    flow.stepWarn("interaction.not_found", { meta: { customId } });
    return false;
  }

  const { action, state } = entry;

  const def = actions.get(action);

  if (!def) {
    flow.stepWarn("action.not_found", { meta: { action } });
    return false;
  }

  try {
    await def.handler(ctx, state ?? {});

    flow.success({ meta: { action } });
    return true;
  } catch (err) {
    flow.fail(err, { meta: { action } });
    return false;
  }
}

// =====================================
// 🔹 INTERACTION STATE
// =====================================

export function getInteractionState(customId: string) {
  return uiStore.get(customId)?.state;
}

export function setInteractionState(customId: string, state: any) {
  const entry = uiStore.get(customId);
  if (!entry) return;

  uiStore.set(customId, {
    ...entry,
    state,
  });
}

// =====================================
// 🔹 CLONE INTERACTION
// =====================================

export function cloneInteraction(
  customId: string,
  newCustomId: string,
  overrides?: Partial<{ state: any; action: string }>
) {
  const entry = uiStore.get(customId);
  if (!entry) return;

  uiStore.set(newCustomId, {
    action: overrides?.action ?? entry.action,
    state: overrides?.state ?? entry.state,
    createdAt: Date.now(),
  });
}

// =====================================
// 🔹 EXPIRE / CLEANUP
// =====================================

export function expireInteraction(customId: string) {
  uiStore.delete(customId);
}