// =====================================
// 📁 src/systems/translation/translation.listener.ts
// =====================================

import {
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import { createRootContext } from "@/trace";
import { createLogger } from "@/foundation/logger";

import { TRANSLATION_TRIGGER_EMOJI } from "./translationConfig";

// =====================================
// 🚀 INIT (BRIDGE ONLY)
// =====================================

export function initTranslationListener(client: Client) {
  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      if (reaction.emoji.name !== TRANSLATION_TRIGGER_EMOJI) return;
      if (!reaction.message.inGuild()) return;

      const message = reaction.message;

      if (!message.guildId) return;

      const ctx = createRootContext({
        source: "discord",
        system: "translation",
      });

      const log = createLogger(ctx);
      const flow = log.flow("listener");

      flow.start({
        meta: { messageId: message.id },
      });

      // =====================================
      // ❌ NO CONTENT
      // =====================================

      if (!message.content) {
        await message.reply({
          content: "❌ This message cannot be translated.",
        });

        flow.stepWarn("no_content");
        flow.success();
        return;
      }

      // =====================================
      // 🧠 BUILD BUTTON (JSON)
      // =====================================

      const customId = JSON.stringify({
        action: "translation.open",
        payload: {
          messageId: message.id,
        },
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(customId)
          .setLabel("🌐 Translate")
          .setStyle(ButtonStyle.Primary)
      );

      // =====================================
      // 📤 SEND PANEL
      // =====================================

      const panel = await message.channel.send({
        content: `🌍 **Translation**\n\n"${message.content}"`,
        components: [row],
      });

      flow.stepInfo("panel.sent");

      // =====================================
      // 🧹 AUTO CLEANUP
      // =====================================

      setTimeout(() => {
        panel.delete().catch(() => null);
      }, 15000);

      flow.success();
    } catch (err) {
      const ctx = createRootContext({
        source: "discord",
        system: "translation",
      });

      createLogger(ctx).flow("listener").fail(err);
    }
  });
}