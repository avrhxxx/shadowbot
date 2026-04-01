// =====================================
// 📁 src/ui/core/uiDiscordAdapter.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  CacheType,
} from "discord.js";

import {
  parseCustomId,
  executeUIAction,
} from "./uiRouter";

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🧠 MAIN HANDLER
// =====================================

export async function handleUIInteraction(
  interaction: Interaction<CacheType>,
  ctx: TraceContext
): Promise<boolean> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.router");

  try {
    // =====================================
    // 🔘 ONLY BUTTONS (na razie)
    // =====================================

    if (!interaction.isButton()) {
      return false;
    }

    const button = interaction as ButtonInteraction;

    flow.stepDebug("interaction.received", {
      meta: { id: button.customId },
    });

    // =====================================
    // 🔍 PARSE ID
    // =====================================

    const { action, payload } = parseCustomId(
      button.customId
    );

    // =====================================
    // 🚀 EXECUTE (🔥 przez router + runtime)
    // =====================================

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

    return true;
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