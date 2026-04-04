import type {
  Interaction as BaseInteraction,
  ButtonInteraction as BaseButtonInteraction,
  ModalSubmitInteraction as BaseModalSubmitInteraction,
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
// 🧠 MAIN HANDLER
// =====================================

export async function handleUIInteraction(
  interaction: ExtendedInteraction,
  ctx: TraceContext
): Promise<boolean> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.router");

  try {
    // =====================================
    // 🔘 BUTTON INTERACTIONS
    // =====================================
    if (interaction.isButton()) {
      const button = interaction as ExtendedButtonInteraction;

      flow.stepDebug("interaction.received", {
        meta: { id: button.customId },
      });

      const { action, payload } = parseCustomId(button.customId);

      flow.stepDebug("interaction.parsed", {
        meta: { action, payload },
      });

      const handled = await executeUIAction(
        action,
        button,
        ctx,
        payload
      );

      if (!handled) {
        flow.stepWarn("action.not_found", {
          meta: { action },
        });
        return false;
      }

      flow.stepDebug("action.executed", {
        meta: { action },
      });

      return true;
    }

    // =====================================
    // 🔘 MODAL SUBMIT INTERACTIONS
    // =====================================
    if (interaction.isModalSubmit()) {
      const modal = interaction as ExtendedModalSubmitInteraction;

      flow.stepDebug("interaction.received_modal", {
        meta: { id: modal.customId },
      });

      const { action, payload } = parseCustomId(modal.customId);

      flow.stepDebug("interaction.parsed_modal", {
        meta: { action, payload },
      });

      const handled = await executeUIAction(
        action,
        modal,
        ctx,
        payload
      );

      if (!handled) {
        flow.stepWarn("modal.action.not_found", {
          meta: { action },
        });
        return false;
      }

      flow.stepDebug("modal.action.executed", {
        meta: { action },
      });

      return true;
    }

    // =====================================
    // 🔘 OTHER INTERACTIONS (IGNORED)
    // =====================================
    return false;
  } catch (err) {
    flow.fail(err);

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ UI error occurred.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp?.(payload);
      } else {
        await interaction.reply?.(payload);
      }
    }

    return true;
  }
}