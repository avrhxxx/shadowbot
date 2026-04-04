// =====================================
// 📁 src/ui/api/interaction.ts
// =====================================

/**
 * 🧠 ROLE:
 * Publiczne API do zarządzania interakcjami
 *
 * 📥 INPUT:
 * - customId / ctx / content / state / options
 *
 * 📤 OUTPUT:
 * - centralny handler, chain, defer, reply, update, expire, clone
 *
 * ❗ RULES:
 * - Każda interakcja ma unikalne UIId
 * - Trace + logger automatyczny
 */

import { uiStore } from "@/ui/store/uiStore";
import { createUIId } from "@/foundation/ids/idGenerator";
import type { TraceContext } from "@/trace";
import type { InteractionOptions } from "@/ui/types/uiTypes";

// =====================================
// 🔹 PUBLIC API
// =====================================

export const interaction = {
  /**
   * Centralny handler interakcji
   */
  handle(ctx: TraceContext, customId: string) {
    uiStore.handleInteraction(ctx, customId);
  },

  /**
   * Chain / wizard / follow-up
   */
  chain(
    currentViewId: string,
    nextViewId: string,
    state?: Record<string, any>,
    options?: InteractionOptions
  ) {
    uiStore.chainInteraction(currentViewId, nextViewId, state, options);
  },

  /**
   * Odroczenie odpowiedzi (defer)
   */
  defer(customId: string) {
    uiStore.deferInteraction(customId);
  },

  /**
   * Uproszczona odpowiedź
   */
  reply(customId: string, content: string | Record<string, any>, options?: InteractionOptions) {
    uiStore.replyInteraction(customId, content, options);
  },

  /**
   * Aktualizacja widoku przez interakcję
   */
  update(customId: string, viewId: string, state?: Record<string, any>, options?: InteractionOptions) {
    uiStore.updateInteractionView(customId, viewId, state, options);
  },

  /**
   * Wygaszenie interakcji
   */
  expire(customId: string) {
    uiStore.expireInteraction(customId);
  },

  /**
   * Klonowanie interakcji
   */
  clone(customId: string, newId?: string, overrides?: Partial<InteractionOptions>) {
    const id = newId || createUIId();
    uiStore.cloneInteraction(customId, id, overrides);
    return id;
  },
};