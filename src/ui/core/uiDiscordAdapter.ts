// =====================================
// 📁 src/ui/core/uiDiscordAdapter.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  CacheType,
} from "discord.js";

import {
  parseCustomId,
  executeUIAction,
} from "./uiRouter";

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🔹 TYPOWE ROZSZERZENIE (dla TS)
// =====================================

type ExtendedInteraction = Interaction<CacheType> & {
  showModal?: (modal: any) => Promise<any>;
  renderView?: (viewId: string, state?: any) => Promise<any>;
  navigate?: (destination: string, options?: any) => Promise<void>;
};

// =====================================
// 🧠 MAIN HANDLER
// =====================================

export async function handleUIInteraction(
  interaction: Interaction<CacheType>,
  ctx: TraceContext
): Promise<boolean> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.router");

  const extInteraction = interaction as ExtendedInteraction;

  // dodajemy UIContext funkcje
  const ctxUI = {
    ...extInteraction,
    showModal: extInteraction.showModal,
    renderView: async (viewId: string, state?: any) => {
      const { renderView } = await import("./uiEngine");
      return renderView(ctx, viewId, state);
    },
    navigate: async (destination: string, options?: any) => {
      await extInteraction.reply?.({
        content: `Navigating to ${destination}`,
        ephemeral: true,
      });
    },
  };

  try {
    // =====================================
    // 🔘 BUTTON INTERACTIONS
    // =====================================
    if (interaction.isButton()) {
      const button = interaction as ButtonInteraction;

      flow.stepDebug("interaction.received", { meta: { id: button.customId } });

      const { action, payload } = parseCustomId(button.customId);

      flow.stepDebug("interaction.parsed", { meta: { action, payload } });

      const handled = await executeUIAction(action, ctxUI, payload);

      if (!handled) {
        flow.stepWarn("action.not_found", { meta: { action } });
        return false;
      }

      flow.stepDebug("action.executed", { meta: { action } });
      return true;
    }

    // =====================================
    // 🔘 MODAL SUBMIT INTERACTIONS
    // =====================================
    if (interaction.isModalSubmit()) {
      const modal = interaction as ModalSubmitInteraction;

      flow.stepDebug("interaction.received_modal", { meta: { id: modal.customId } });

      const { action, payload } = parseCustomId(modal.customId);

      flow.stepDebug("interaction.parsed_modal", { meta: { action, payload } });

      const handled = await executeUIAction(action, ctxUI, payload);

      if (!handled) {
        flow.stepWarn("modal.action.not_found", { meta: { action } });
        return false;
      }

      flow.stepDebug("modal.action.executed", { meta: { action } });
      return true;
    }

    // =====================================
    // 🔘 OTHER INTERACTIONS (IGNORED)
    // =====================================
    return false;
  } catch (err) {
    flow.fail(err);

    if (interaction.isRepliable()) {
      const payload = { content: "❌ UI error occurred.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }

    return true;
  }
}
