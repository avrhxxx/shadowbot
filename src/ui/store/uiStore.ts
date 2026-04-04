// =====================================
// 📁 src/ui/store/uiStore.ts
// =====================================

/**
 * 🧠 ROLE:
 * Core silnik UI (ukryty dla deweloperów)
 *
 * Zarządza:
 * - view (show, update, followUp, transition)
 * - buttons (dynamicState, clone, row, group)
 * - modals (register, show, clone, validate)
 * - interactions (handle, chain, defer, reply, update, expire, clone)
 *
 * 🔹 Wszystko ephemeral i trace-ready
 */

import { createUIId } from "@/foundation/ids/idGenerator";
import { baseLogger } from "@/foundation/logger/loggerFactory";
import { TraceContext } from "@/trace";
import mitt from "mitt";
import type { View, Button, ModalDefinition, InteractionOptions } from "@/ui/types/uiTypes";

// =====================================
// 🔹 STORE STRUCTURE
// =====================================

type UIState = {
  views: Record<string, View>;
  buttons: Record<string, Button>;
  modals: Record<string, ModalDefinition>;
  interactions: Record<string, { ctx: TraceContext; options?: InteractionOptions }>;
};

class UIStore {
  private state: UIState = {
    views: {},
    buttons: {},
    modals: {},
    interactions: {},
  };

  private emitter = mitt();

  // =====================================
  // 🔹 VIEW HANDLERS
  // =====================================

  handleInteraction(ctx: TraceContext, customId: string) {
    const interaction = this.state.interactions[customId];
    if (!interaction) return;
    // wywołanie eventów, chain itp.
    this.emitter.emit("interaction", { ctx, customId });
    baseLogger.info("interaction.handled", { traceId: ctx.traceId, customId });
  }

  chainInteraction(currentViewId: string, nextViewId: string, state?: any, options?: InteractionOptions) {
    // automatyczne stackowanie widoków / wizard
    this.updateView(nextViewId, state, options);
  }

  deferInteraction(customId: string) {
    // odroczona odpowiedź
    baseLogger.info("interaction.deferred", { customId });
  }

  replyInteraction(customId: string, content: any, options?: InteractionOptions) {
    baseLogger.info("interaction.reply", { customId, content });
  }

  updateInteractionView(customId: string, viewId: string, state?: any, options?: InteractionOptions) {
    this.updateView(viewId, state, options);
    baseLogger.info("interaction.view.updated", { customId, viewId });
  }

  expireInteraction(customId: string) {
    delete this.state.interactions[customId];
    baseLogger.info("interaction.expired", { customId });
  }

  cloneInteraction(customId: string, newId: string, overrides?: Partial<InteractionOptions>) {
    const original = this.state.interactions[customId];
    if (!original) return;
    this.state.interactions[newId] = { ...original, options: { ...original.options, ...overrides } };
    baseLogger.info("interaction.cloned", { from: customId, to: newId });
  }

  // =====================================
  // 🔹 VIEW UTILS
  // =====================================

  updateView(viewId: string, state?: any, options?: InteractionOptions) {
    const view = this.state.views[viewId];
    if (!view) return;
    view.state = { ...view.state, ...state };
    if (options?.ttl) {
      setTimeout(() => this.removeView(viewId), options.ttl);
    }
    baseLogger.info("view.updated", { viewId });
  }

  removeView(viewId: string) {
    delete this.state.views[viewId];
    baseLogger.info("view.removed", { viewId });
  }

  registerView(view: View) {
    const id = view.id || createUIId();
    this.state.views[id] = { ...view, id };
    baseLogger.info("view.registered", { viewId: id });
    return id;
  }

  // =====================================
  // 🔹 BUTTON / MODAL HANDLERS
  // =====================================

  registerButton(button: Button) {
    const id = button.id || createUIId();
    this.state.buttons[id] = { ...button, id };
    return id;
  }

  registerModal(modal: ModalDefinition) {
    const id = modal.id || createUIId();
    this.state.modals[id] = { ...modal, id };
    return id;
  }
}

export const uiStore = new UIStore();