// =====================================
// 📁 src/system/translation/TranslationModule.ts
// =====================================

import {
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  MessageFlags
} from "discord.js";
import fetch from "node-fetch";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

// =====================================
// 🔹 CONFIG
// =====================================

const LIBRE_URL =
  process.env.LIBRE_URL ||
  "https://libretranslate-production-26a3.up.railway.app/translate";

const GOOGLE_URL =
  process.env.GOOGLE_URL ||
  "https://translate.googleapis.com/translate_a/single";

// =====================================
// 🔹 TYPES
// =====================================

interface LibreResponse {
  translatedText: string;
}

type GoogleResponse = string[][][];

const LANGUAGES = [
  { code: "en", label: "English", emoji: "🇬🇧" },
  { code: "pl", label: "Polish", emoji: "🇵🇱" },
  { code: "de", label: "German", emoji: "🇩🇪" },
  { code: "fr", label: "French", emoji: "🇫🇷" },
  { code: "ru", label: "Russian", emoji: "🇷🇺" },
  { code: "uk", label: "Ukrainian", emoji: "🇺🇦" },
  { code: "sv", label: "Swedish", emoji: "🇸🇪" },
  { code: "es", label: "Spanish", emoji: "🇪🇸" },
  { code: "it", label: "Italian", emoji: "🇮🇹" },
  { code: "nl", label: "Dutch", emoji: "🇳🇱" },
  { code: "pt", label: "Portuguese", emoji: "🇵🇹" },
  { code: "ja", label: "Japanese", emoji: "🇯🇵" }
];

// =====================================
// 🚀 MODULE INIT
// =====================================

export function initTranslationModule(client: Client, ctx: TraceContext) {
  const l = log.ctx(ctx);

  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      if (reaction.emoji.name !== "🈯") return;
      if (!reaction.message.inGuild()) return;

      const message = reaction.message;

      if (!message.content) return;

      l.event("reaction_trigger", {
        messageId: message.id,
        userId: user.id
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(`"${message.content}"`)
        .setColor("Blue")
        .setFooter({
          text: "You have 60 seconds to choose a language."
        });

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];

      for (let i = 0; i < LANGUAGES.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>();

        for (const lang of LANGUAGES.slice(i, i + 5)) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`translate_${message.id}_${lang.code}`)
              .setLabel(lang.label)
              .setEmoji(lang.emoji)
              .setStyle(ButtonStyle.Primary)
          );
        }

        rows.push(row);
      }

      const panel = await message.channel.send({
        embeds: [embed],
        components: rows
      });

      const collector = panel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000
      });

      collector.on("collect", async (interaction) => {
        try {
          const parts = interaction.customId.split("_");

          if (parts.length < 3) {
            await interaction.reply({
              content: "❌ Invalid interaction.",
              ephemeral: true
            });
            return;
          }

          const langCode = parts[2];

          l.event("language_selected", { langCode });

          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          }

          const translated = await translateText(
            message.content,
            langCode,
            l
          );

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `🌍 Translation (${langCode.toUpperCase()})\n\n"${translated}"`
                )
                .setColor("Green")
            ]
          });

        } catch (error) {
          l.error("interaction_error", { error });

          if (interaction.isRepliable()) {
            const payload = {
              content: "❌ Translation failed.",
              ephemeral: true
            };

            if (interaction.deferred || interaction.replied) {
              await interaction.followUp(payload);
            } else {
              await interaction.reply(payload);
            }
          }
        }
      });

      collector.on("end", async () => {
        try {
          l.event("collector_end");

          const disabledRows = rows.map((row) => {
            const newRow = new ActionRowBuilder<ButtonBuilder>();

            row.components.forEach((btn) => {
              newRow.addComponents(ButtonBuilder.from(btn).setDisabled(true));
            });

            return newRow;
          });

          await panel.edit({
            components: disabledRows,
            embeds: [
              EmbedBuilder.from(embed).setFooter({
                text: "Translation panel expired."
              })
            ]
          });

          setTimeout(async () => {
            try {
              await panel.delete().catch(() => {});
            } catch {}
          }, 1000);

        } catch (error) {
          l.error("cleanup_error", { error });
        }
      });

    } catch (error) {
      l.error("module_error", { error });
    }
  });

  // =====================================
  // 🌍 TRANSLATION
  // =====================================

  async function translateText(
    text: string,
    target: string,
    l: ReturnType<typeof log.ctx>
  ): Promise<string> {
    // =============================
    // LIBRE
    // =============================
    try {
      const res = await fetch(LIBRE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "auto",
          target,
          format: "text"
        })
      });

      if (res.ok) {
        const data = (await res.json()) as Partial<LibreResponse>;

        if (typeof data.translatedText === "string") {
          return data.translatedText;
        }
      }
    } catch (error) {
      l.warn("libre_failed", { error });
    }

    // =============================
    // GOOGLE FALLBACK
    // =============================
    try {
      const params = new URLSearchParams({
        client: "gtx",
        sl: "auto",
        tl: target,
        dt: "t",
        q: text
      });

      const res = await fetch(`${GOOGLE_URL}?${params.toString()}`);
      const data = (await res.json()) as GoogleResponse;

      if (
        Array.isArray(data) &&
        Array.isArray(data[0]) &&
        Array.isArray(data[0][0]) &&
        typeof data[0][0][0] === "string"
      ) {
        return data[0][0][0];
      }
    } catch (error) {
      l.error("google_failed", { error });
    }

    return "Translation failed.";
  }
}