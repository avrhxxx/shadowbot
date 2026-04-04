// =====================================
// 📁 src/ui/core/uiDiscordAdapter.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  CacheType,
  ModalSubmitInteraction,
} from "discord.js";

import {
  parseCustomId,
  executeUIAction,
} from "./uiRouter";

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

export async function handleUIInteraction(
  interaction: Interaction<CacheType>,
  ctx: TraceContext
): Promise<boolean> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.router");

  try {
    // 🔘 BUTTON INTERACTIONS
    if (interaction.isButton()) {
      const button = interaction as ButtonInteraction;

      flow.stepDebug("interaction.received", {
        meta: { id: button.customId },
      });

      const { action, payload } = parseCustomId(button.customId);

      flow.stepDebug("interaction.parsed", {
        meta: { action, payload: payload ?? {} },
      });

      const handled = await executeUIAction(action, button, ctx, payload);

      if (!handled) {
        flow.stepWarn("action.not_found", {
          meta: { action },
        });
        return false;
      }

      flow.stepDebug("action.executed", { meta: { action } });
      return true;
    }

    // 🔘 MODAL SUBMIT INTERACTIONS
    if (interaction.isModalSubmit()) {
      const modal = interaction as ModalSubmitInteraction;

      flow.stepDebug("interaction.received_modal", {
        meta: { id: modal.customId },
      });

      const { action, payload } = parseCustomId(modal.customId);

      flow.stepDebug("interaction.parsed_modal", {
        meta: { action, payload: payload ?? {} },
      });

      const handled = await executeUIAction(action, modal, ctx, payload);

      if (!handled) {
        flow.stepWarn("modal.action.not_found", { meta: { action } });
        return false;
      }

      flow.stepDebug("modal.action.executed", { meta: { action } });
      return true;
    }

    // 🔘 OTHER INTERACTIONS → currently ignored, could extend later
    flow.stepDebug("interaction.ignored", {
      meta: { type: interaction.type },
    });

    return false;
  } catch (err) {
    flow.fail(err);

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ UI error occurred.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }

    return true;
  }
}
