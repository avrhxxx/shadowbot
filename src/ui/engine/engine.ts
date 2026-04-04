// =====================================
// 📁 src/ui/engine/engine.ts
// =====================================

/**
 * 🧠 ROLE:
 * Core UI Engine:
 * - render view
 * - map buttons -> discord components
 * - generuje interaction (customId + store + TTL)
 *
 * ❗ INTERNAL ONLY
 */

import { nanoid } from "nanoid";
import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

import type { View, ViewResult, Button } from "../types/uiTypes";
import { uiStore } from "../store/uiStore";
import { withTTL } from "../store/ttl";

// =====================================
// 🔹 INTERNAL STORE (VIEWS)
// =====================================

const views = new Map<string, View>();

export function registerView(view: View) {
  views.set(view.id, view);
}

// =====================================
// 🔹 BUTTON → DISCORD
// =====================================

function mapStyle(style?: Button["style"]): number {
  switch (style) {
    case "secondary": return 2;
    case "danger": return 4;
    default: return 1;
  }
}

// 🔥 KLUCZOWA FUNKCJA
function createCustomId(action: string, state?: any, ttl?: number) {
  const id = nanoid();

  uiStore.set(
    id,
    withTTL(
      {
        action,
        state,
      },
      ttl
    )
  );

  return id;
}

function mapButtons(buttons: Button[] = []) {
  const rows: any[] = [];

  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({
      type: 1,
      components: buttons.slice(i, i + 5).map((btn) => ({
        type: 2,
        label: btn.label,
        style: mapStyle(btn.style),
        custom_id: createCustomId(
          btn.action,
          btn.state,
          btn.ttl // 🔥 teraz możesz sterować TTL z buttona
        ),
        disabled: btn.disabled ?? false,
      })),
    });
  }

  return rows;
}

// =====================================
// 🔹 RENDER VIEW
// =====================================

export async function renderViewInternal(
  ctx: TraceContext,
  viewId: string,
  state?: any
) {
  const log = createLogger(ctx);
  const flow = log.flow("ui.render");

  flow.start({ meta: { viewId } });

  const view = views.get(viewId);
  if (!view) {
    flow.fail(new Error("view_not_found"), { meta: { viewId } });
    throw new Error(`View not found: ${viewId}`);
  }

  try {
    const result: ViewResult = await view.render(ctx, state ?? {});

    const components = mapButtons(result.buttons ?? []);

    flow.success({
      stats: { buttons: result.buttons?.length ?? 0 },
    });

    return {
      content: result.content,
      components,
      embed: result.embed,
      ephemeral: result.ephemeral,
    };
  } catch (err) {
    flow.fail(err);
    throw err;
  }
}