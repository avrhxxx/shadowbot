// =====================================
// 📁 src/ui/core/uiDiscordAdapter.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  CacheType,
} from "discord.js";

import { parseCustomId, getUIAction } from "./uiRouter";

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🔧 HELPERS
// =====================================

async function safeReply(
  interaction: ButtonInteraction<CacheType>,
  content: string
) {
  const payload = {
    content,
    ephemeral: true,
  };

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

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

    const handler = getUIAction(action);

    if (!handler) {
      flow.stepWarn("action.not_found", {
        meta: { action },
      });

      return false;
    }

    // =====================================
    // 🚀 EXECUTE ACTION
    // =====================================

    await handler(button, ctx, payload);

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
