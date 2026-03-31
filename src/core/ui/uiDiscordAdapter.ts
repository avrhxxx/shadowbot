// =====================================
// 📁 src/core/ui/uiDiscordAdapter.ts
// =====================================

import {
  Interaction,
  ButtonInteraction,
  CacheType,
} from "discord.js";

import { handleInteraction, renderView } from "./uiEngine";

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🔹 TYPES
// =====================================

type UIResponse = Awaited<ReturnType<typeof handleInteraction>>;

// =====================================
// 🔧 HELPERS
// =====================================

async function sendReply(
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

async function renderToDiscord(
  interaction: ButtonInteraction<CacheType>,
  ctx: TraceContext,
  viewId: string,
  state?: any
) {
  const view = await renderView(ctx, viewId, state);

  const components =
    view.buttons && view.buttons.length > 0
      ? [
          {
            type: 1, // ActionRow
            components: view.buttons.map((b) => ({
              type: 2, // Button
              label: b.label,
              style: mapStyle(b.style),
              custom_id: b.customId,
            })),
          },
        ]
      : [];

  const payload = {
    content: view.content ?? "",
    components,
  };

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply(payload);
  }

  return interaction.reply(payload);
}

function mapStyle(style?: string) {
  switch (style) {
    case "secondary":
      return 2;
    case "danger":
      return 4;
    default:
      return 1; // primary
  }
}

// =====================================
// 🧠 MAIN HANDLER
// =====================================

export async function handleUIInteraction(
  interaction: Interaction<CacheType>,
  ctx: TraceContext
): Promise<boolean> {
  const log = createLogger(ctx);
  const flow = log.flow("ui.discord");

  try {
    if (!interaction.isButton()) {
      return false;
    }

    const button = interaction as ButtonInteraction;

    flow.stepDebug("button.received", {
      meta: { id: button.customId },
    });

    const result: UIResponse = await handleInteraction(
      ctx,
      button.customId
    );

    // =====================================
    // 🔀 RESULT ROUTING
    // =====================================

    if (result.type === "view") {
      await renderToDiscord(
        button,
        ctx,
        result.view,
        result.state
      );

      return true;
    }

    if (result.type === "reply") {
      await sendReply(button, result.content);
      return true;
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