// =====================================
// 📁 src/ui/api/modal.ts
// =====================================

/**
 * 🧠 ROLE:
 * Publiczne API do zarządzania Modalami
 *
 * 📥 INPUT:
 * - modalId / fields / state / options
 *
 * 📤 OUTPUT:
 * - rejestracja, wyświetlanie, klonowanie, walidacja, dynamiczne pola
 *
 * ❗ RULES:
 * - Każdy modal ma unikalne UIId
 * - Trace + logger automatyczny
 */

import { uiStore } from "@/ui/store/uiStore";
import { createUIId } from "@/foundation/ids/idGenerator";
import type { ModalDefinition, ModalField } from "@/ui/types/uiTypes";

// =====================================
// 🔹 PUBLIC API
// =====================================

export const modal = {
  /**
   * Pokazuje modal
   */
  show(modalId: string, state?: Record<string, any>, options?: Record<string, any>) {
    uiStore.showModal(modalId, state, options);
  },

  /**
   * Rejestracja nowego modala
   */
  register(modal: ModalDefinition) {
    const id = createUIId();
    uiStore.registerModal(id, modal);
    return id;
  },

  /**
   * Klonowanie modala
   */
  clone(modalId: string, newId?: string, state?: Record<string, any>) {
    const id = newId || createUIId();
    uiStore.cloneModal(modalId, id, state);
    return id;
  },

  /**
   * Walidacja input modala
   */
  validate(modalId: string, validatorFn: (state: Record<string, any>) => boolean) {
    uiStore.setModalValidator(modalId, validatorFn);
  },

  /**
   * Dynamiczna zmiana pól input
   */
  dynamicFields(modalId: string, fields: ModalField[]) {
    uiStore.updateModalFields(modalId, fields);
  },
};