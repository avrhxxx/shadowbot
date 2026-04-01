// =====================================
// 📁 src/systems/translation/listeners/translation.listener.ts
// =====================================

import { Client, EmbedBuilder } from "discord.js";

import { createChildContext } from "@/trace";
import { createLogger } from "@/foundation/logger";

import { TRANSLATION_TRIGGER_EMOJI } from "../translationConfig";
import type { TraceContext } from "@/trace";

// =====================================
// 🚀 INIT
// =====================================

export function initTranslationListener(
  client: Client,
  parentCtx: TraceContext
) {
  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial)
        await reaction.message.fetch();

      if (
        reaction.emoji.name !== TRANSLATION_TRIGGER_EMOJI
      )
        return;

      if (!reaction.message.inGuild()) return;

      const message = reaction.message;

      if (!message.content) return;
      if (!message.guildId) return;

      // =====================================
      // 🧠 CTX + LOG
      // =====================================

      const ctx = createChildContext(parentCtx, {
        source: "discord",
        system: "translation",
        guildId: message.guildId,
        userId: user.id,
        channelId: message.channelId,
        messageId: message.id,
      });

      const log = createLogger(ctx);
      const flow = log.flow("listener");

      flow.start({
        meta: { messageId: message.id },
      });

      // =====================================
      // 🎯 EMBED + BUTTON
      // =====================================

      const embed = new EmbedBuilder()
        .setDescription(message.content)
        .setAuthor({
          name: message.author?.username || "Unknown",
          iconURL: message.author?.displayAvatarURL(),
        })
        .setColor(0x00aaff)
        .setTimestamp();

      const sentMessage = await message.channel.send({
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "Translate",
                style: 1,
                custom_id: `translation.open|messageId=${message.id}`,
              },
            ],
          },
        ],
      });

      // =====================================
      // ⏱ AUTO DELETE
      // =====================================

      setTimeout(() => {
        sentMessage.delete().catch(() => {});
      }, 60_000); // 60 sekund

      flow.success();
    } catch (err) {
      const ctx = createChildContext(parentCtx, {
        source: "discord",
        system: "translation",
        userId: user.id,
      });

      const log = createLogger(ctx);
      log.error("translation.listener.error", err);
    }
  });
}