// =====================================
// 📁 src/core/ui/uiEngine.ts
// =====================================

import { nanoid } from "nanoid";
import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

type ViewResult = {
  content?: string;
  buttons?: Button[];
};

type Button = {
  label: string;
  action: string;
  state?: any;
  style?: "primary" | "secondary" | "danger";
};

type View = {
  id: string;
  render: (ctx: TraceContext, state?: any) => Promise<ViewResult> | ViewResult;
};

type ActionResult =
  | { type: "view"; view: string; state?: any }
  | { type: "reply"; content: string }
  | { type: "none" };

type Action = {
  id: string;
  execute: (ctx: TraceContext, state?: any) => Promise<ActionResult> | ActionResult;
};

type StoreEntry = {
  action: string;
  state?: any;
  createdAt: number;
};

const store = new Map<string, StoreEntry>();
const TTL = 1000 * 60 * 5; // 5 min

const views = new Map<string, View>();
const actions = new Map<string, Action>();

export function registerView(view: View) {
  views.set(view.id, view);
}

export function registerAction(action: Action) {
  actions.set(action.id, action);
}

function isExpired(entry: StoreEntry) {
  return Date.now() - entry.createdAt > TTL;
}

function createCustomId(action: string, state?: any) {
  const id = nanoid();
  store.set(id, { action, state, createdAt: Date.now() });
  return id;
}

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

    return { content: result.content, buttons };
  } catch (err) {
    flow.fail(err);
    throw err;
  }
}

export async function handleInteraction(ctx: TraceContext, customId: string): Promise<ActionResult> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.interaction");

  flow.start({ meta: { customId } });

  const entry = store.get(customId);
  if (!entry) {
    flow.stepWarn("not_found");
    return { type: "reply", content: "⚠️ This interaction is no longer valid." };
  }

  if (isExpired(entry)) {
    store.delete(customId);
    flow.stepWarn("expired");
    return { type: "reply", content: "⏳ This interaction expired." };
  }

  const action = actions.get(entry.action);
  if (!action) {
    flow.fail(new Error("action_not_found"), { meta: { action: entry.action } });
    return { type: "reply", content: "❌ Action not found." };
  }

  try {
    const result = await action.execute(ctx, entry.state ?? {});
    flow.success({ meta: { action: entry.action } });
    return result;
  } catch (err) {
    flow.fail(err, { meta: { action: entry.action } });
    return { type: "reply", content: "❌ Something went wrong." };
  }
}