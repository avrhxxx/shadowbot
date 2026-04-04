// =====================================
// 📁 src/ui/api/view.ts
// =====================================

/**
 * 🧠 ROLE:
 * Publiczne API do zarządzania Views
 *
 * 📥 INPUT:
 * - viewId / state / options
 *
 * 📤 OUTPUT:
 * - wyświetlanie, aktualizacja, follow-up, clone, remove
 *
 * ❗ RULES:
 * - Dev importuje tylko UI API
 * - Każdy view ma unikalne UIId
 * - Trace i logger wbudowany
 */

import { uiStore } from "@/ui/store/uiStore";
import { createUIId } from "@/foundation/ids/idGenerator";
import type { View, ViewOptions } from "@/ui/types/uiTypes";

// =====================================
// 🔹 PUBLIC API
// =====================================

export const view = {
  /**
   * Pokaż view
   */
  show(viewId: string, state?: Record<string, any>, options?: ViewOptions) {
    const id = viewId ?? createUIId();
    uiStore.registerView(id, state, options);
    uiStore.renderView(id);
    return id;
  },

  /**
   * Aktualizuj view
   */
  update(viewId: string, state?: Record<string, any>, options?: ViewOptions) {
    uiStore.updateView(viewId, state, options);
  },

  /**
   * Ephemeral follow-up
   */
  followUp(viewId: string, state?: Record<string, any>, options?: ViewOptions) {
    uiStore.followUpView(viewId, state, options);
  },

  /**
   * Transition / Next View
   */
  transition(
    currentViewId: string,
    nextViewId: string,
    state?: Record<string, any>,
    options?: ViewOptions
  ) {
    uiStore.transitionView(currentViewId, nextViewId, state, options);
  },

  /**
   * Rejestracja tymczasowego view
   */
  registerTemp(view: View, ttl?: number) {
    uiStore.registerTempView(view, ttl);
  },

  /**
   * Usuń view
   */
  remove(viewId: string) {
    uiStore.removeView(viewId);
  },

  /**
   * Skopiuj view
   */
  clone(viewId: string, newId?: string, state?: Record<string, any>) {
    const id = newId ?? createUIId();
    uiStore.cloneView(viewId, id, state);
    return id;
  },

  /**
   * Dynamiczna zmiana buttonów
   */
  dynamicButtons(viewId: string, buttons?: string[]) {
    uiStore.updateButtons(viewId, buttons);
  },
};