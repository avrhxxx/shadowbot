// =====================================
// 📁 src/ui/core/uiDiscordAdapter.ts
// =====================================

import type {
  Interaction as BaseInteraction,
  ButtonInteraction as BaseButtonInteraction,
  ModalSubmitInteraction as BaseModalSubmitInteraction,
  CacheType,
} from "discord.js";

import { parseCustomId, executeUIAction } from "./uiRouter";
import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🔹 TYPOWE ROZSZERZENIE (dla TS)
// =====================================

type ExtendedInteraction = BaseInteraction<CacheType> & {
  update?: (payload: any) => Promise<any>;
  send?: (payload: any) => Promise<any>;
  showModal?: (modal: any) => Promise<any>;
  reply?: (payload: any) => Promise<any>;
  followUp?: (payload: any) => Promise<any>;
  deferred?: boolean;
  replied?: boolean;
};

type ExtendedButtonInteraction = BaseButtonInteraction<CacheType> & ExtendedInteraction;
type ExtendedModalSubmitInteraction = BaseModalSubmitInteraction<CacheType> & ExtendedInteraction;

// =====================================
// 🔹 CREATE UI CONTEXT
// =====================================

function createUIContext(interaction: ExtendedInteraction) {
  return {
    interaction,
    renderView: async (viewId: string, state?: any) => {
      const { renderView } = await import("./uiEngine");
      return renderView({ interaction } as any, viewId, state);
    },
    showModal: async (modal: any, payload?: any) => {
      if (!interaction.showModal) throw new Error("Interaction can't show modal");
      return interaction.showModal(modal);
    },
    navigate: async (destination: string, options?: any) => {
      await interaction.reply?.({
        content: `Navigating to ${destination}`,
        ephemeral: true,
      });
    },
  };
}

// =====================================
// 🧠 MAIN HANDLER
// =====================================

export async function handleUIInteraction(
  interaction: ExtendedInteraction,
  ctxTrace: TraceContext
): Promise<boolean> {
  const log = createLogger(ctxTrace);
  const flow = log.flow("ui.router");

  const ctx = createUIContext(interaction);

  try {
    if (interaction.isButton() || interaction.isModalSubmit()) {
      const { action, payload } = parseCustomId(interaction.customId);
      const handled = await executeUIAction(action, ctx, payload);
      return handled;
    }

    return false;
  } catch (err) {
    flow.fail(err);
    if (interaction.isRepliable()) {
      const payload = { content: "❌ UI error occurred.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp?.(payload);
      } else {
        await interaction.reply?.(payload);
      }
    }
    return true;
  }
}