// =====================================
// 📁 src/core/ui/uiEngine.ts
// =====================================

import { nanoid } from "nanoid";
import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🔹 TYPES
// =====================================

export type Button = {
  label: string;
  action: string;
  state?: any;
  style?: "primary" | "secondary" | "danger";
};

export type ViewResult = {
  content?: string;
  buttons?: Button[];
  embed?: any; // discord embed opcjonalny
  ephemeral?: boolean;
};

export type View = {
  id: string;
  render: (ctx: TraceContext, state?: any) => Promise<ViewResult> | ViewResult;
};

export type ActionResult =
  | { type: "view"; view: string; state?: any }
  | { type: "reply"; content: string; ephemeral?: boolean }
  | { type: "none" };

export type Action = {
  id: string;
  execute: (ctx: TraceContext, state?: any) => Promise<ActionResult> | ActionResult;
};

// =====================================
// 🔹 STORE (IN-MEMORY)
// =====================================

type StoreEntry = { action: string; state?: any; createdAt: number };
const store = new Map<string, StoreEntry>();
const TTL = 1000 * 60 * 5;

// =====================================
// 🔹 REGISTRIES
// =====================================

const views = new Map<string, View>();
const actions = new Map<string, Action>();

// =====================================
// 🔹 REGISTER
// =====================================

export function registerView(view: View) {
  views.set(view.id, view);
}

export function registerAction(action: Action) {
  actions.set(action.id, action);
}

// =====================================
// 🔹 INTERNAL HELPERS
// =====================================

function isExpired(entry: StoreEntry) {
  return Date.now() - entry.createdAt > TTL;
}

function createCustomId(action: string, state?: any) {
  const id = nanoid();
  store.set(id, { action, state: state ?? {}, createdAt: Date.now() });
  return id;
}

// helper do generowania standardowych buttonów
export function createButton(label: string, action: string, style?: Button["style"], state?: any) {
  return { label, action, style, state };
}

export function createBackButton(targetView: string) {
  return createButton("⬅ Back", targetView, "secondary");
}

export function createGuideButton(targetAction: string) {
  return createButton("Guide", targetAction, "secondary");
}

// =====================================
// 🎨 RENDER VIEW
// =====================================

export async function renderView(ctx: TraceContext, viewId: string, state?: any) {
  const log = createLogger(ctx);
  const flow = log.flow("ui.render");
  flow.start({ meta: { viewId } });

  const view = views.get(viewId);
  if (!view) {
    flow.fail(new Error("view_not_found"), { meta: { viewId } });
    throw new Error(`View not found: ${viewId}`);
  }

  try {
    const result = await view.render(ctx, state ?? {});
    const buttons =
      result.buttons?.map((btn) => ({
        label: btn.label,
        style: btn.style ?? "primary",
        customId: createCustomId(btn.action, btn.state ?? {}),
      })) ?? [];

    flow.success({ stats: { buttons: buttons.length } });
    return { content: result.content, buttons, embed: result.embed, ephemeral: result.ephemeral };
  } catch (err) {
    flow.fail(err);
    throw err;
  }
}

// =====================================
// 🖱️ HANDLE INTERACTION
// =====================================

export async function handleInteraction(ctx: TraceContext, customId: string): Promise<ActionResult> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.interaction");
  flow.start({ meta: { customId } });

  const entry = store.get(customId);
  if (!entry) return { type: "reply", content: "⚠️ This interaction is no longer valid." };

  if (isExpired(entry)) {
    store.delete(customId);
    return { type: "reply", content: "⏳ This interaction expired." };
  }

  const action = actions.get(entry.action);
  if (!action) return { type: "reply", content: "❌ Action not found." };

  try {
    const result = await action.execute(ctx, entry.state ?? {});
    return result;
  } catch (err) {
    return { type: "reply", content: "❌ Something went wrong." };
  }
}