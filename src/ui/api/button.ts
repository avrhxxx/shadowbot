// =====================================
// 📁 src/ui/api/button.ts
// =====================================

/**
 * 🧠 ROLE:
 * Publiczne API do zarządzania Buttons
 *
 * 📥 INPUT:
 * - label / action / style / state
 *
 * 📤 OUTPUT:
 * - tworzenie, grupowanie, kopiowanie, dynamic state
 *
 * ❗ RULES:
 * - Każdy button ma unikalne UIId
 * - Trace + logger automatyczny
 */

import { uiStore } from "@/ui/store/uiStore";
import { createUIId } from "@/foundation/ids/idGenerator";
import type { Button, ButtonStyle } from "@/ui/types/uiTypes";

// =====================================
// 🔹 PUBLIC API
// =====================================

export const button = {
  /**
   * Tworzy nowy button
   */
  create(label: string, action: string, style?: ButtonStyle, state?: Record<string, any>) {
    const id = createUIId();
    uiStore.registerButton(id, { label, action, style, state });
    return id;
  },

  /**
   * Standardowy button "back"
   */
  back(targetViewId: string) {
    const id = createUIId();
    uiStore.registerButton(id, { label: "Back", action: `back:${targetViewId}` });
    return id;
  },

  /**
   * Guide / help button
   */
  guide(targetAction: string) {
    const id = createUIId();
    uiStore.registerButton(id, { label: "Help", action: targetAction });
    return id;
  },

  /**
   * Wyłączony button
   */
  disabled(buttonId: string) {
    uiStore.updateButtonState(buttonId, { disabled: true });
  },

  /**
   * Row mapping
   */
  row(buttons: string[]) {
    return buttons;
  },

  /**
   * Klonowanie buttona
   */
  clone(buttonId: string, overrides?: Partial<Button>) {
    const id = createUIId();
    uiStore.cloneButton(buttonId, id, overrides);
    return id;
  },

  /**
   * Grupowanie w rzędy
   */
  group(buttonRows: string[][]) {
    return buttonRows;
  },

  /**
   * Dynamiczna zmiana state
   */
  dynamicState(buttonId: string, state?: Record<string, any>) {
    uiStore.updateButtonState(buttonId, state);
  },
};