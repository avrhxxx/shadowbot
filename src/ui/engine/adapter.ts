// =====================================
// 📁 src/ui/engine/adapter.ts
// =====================================

/**
 * 🧠 ROLE:
 * Discord Adapter (internal)
 *
 * - jedyne miejsce gdzie używamy discord.js
 * - mapuje UI → Discord API
 * - obsługuje reply / update / followUp / defer
 *
 * ❗ INTERNAL ONLY
 */

import type {
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  CacheType,
} from "discord.js";

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

import { executeAction } from "./router";
import { mapButtonsToRows } from "./engine";

// =====================================
// 🔹 TYPES
// =====================================

type UIResponse = {
  content?: string;
  components?: any[];
  embed?: any;
  ephemeral?: boolean;
};

// =====================================
// 🔹 MAIN HANDLER
// =====================================

export async function handleDiscordInteraction(
  interaction: Interaction<CacheType>,
  ctx: TraceContext
): Promise<boolean> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.adapter");

  try {
    // =====================================
    // 🔘 BUTTON
    // =====================================
    if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;

      flow.stepDebug("button.received", {
        meta: { customId: btn.customId },
      });

      const handled = await executeAction(ctx, btn.customId);

      if (!handled) {
        flow.stepWarn("button.not_handled");
        return false;
      }

      return true;
    }

    // =====================================
    // 🔘 SELECT MENU
    // =====================================
    if (interaction.isStringSelectMenu()) {
      const menu = interaction as StringSelectMenuInteraction;

      flow.stepDebug("select.received", {
        meta: { customId: menu.customId },
      });

      const handled = await executeAction(ctx, menu.customId);
      return handled;
    }

    // =====================================
    // 🔘 MODAL SUBMIT
    // =====================================
    if (interaction.isModalSubmit()) {
      const modal = interaction as ModalSubmitInteraction;

      flow.stepDebug("modal.received", {
        meta: { customId: modal.customId },
      });

      const handled = await executeAction(ctx, modal.customId);
      return handled;
    }

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

// =====================================
// 🔹 RESPONSE HELPERS (🔥 KLUCZOWE)
// =====================================

export async function reply(
  interaction: Interaction,
  response: UIResponse
) {
  if (!interaction.isRepliable()) return;

  const payload = normalizeResponse(response);

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

export async function update(
  interaction: Interaction,
  response: UIResponse
) {
  if (!interaction.isRepliable()) return;

  const payload = normalizeResponse(response);

  // ⚠️ tylko dla komponentów (buttony itp.)
  if (interaction.isMessageComponent()) {
    return interaction.update(payload);
  }

  // fallback
  return reply(interaction, response);
}

export async function defer(interaction: Interaction) {
  if (!interaction.isRepliable()) return;

  if (!interaction.deferred && !interaction.replied) {
    return interaction.deferReply();
  }
}

export async function followUp(
  interaction: Interaction,
  response: UIResponse
) {
  if (!interaction.isRepliable()) return;

  const payload = normalizeResponse(response);
  return interaction.followUp(payload);
}

// =====================================
// 🔹 NORMALIZATION (🔥 FIX TYPE ERRORS)
// =====================================

function normalizeResponse(res: UIResponse) {
  return {
    content: res.content,
    embeds: res.embed ? [res.embed] : undefined,
    components: res.components ?? [],
    ephemeral: res.ephemeral ?? false,
  };
}