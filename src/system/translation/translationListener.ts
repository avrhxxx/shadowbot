// =====================================
// 📁 src/system/translation/translationListener.ts
// =====================================

import {
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  Interaction,
} from "discord.js";

import { createChildContext } from "@/core/trace/TraceContext";
import { log } from "@/core/logger/log";

import {
  TRANSLATION_TRIGGER_EMOJI,
  LANGUAGES,
} from "./translationConfig";

import { translateText } from "./translationService";
import {
  getUserLanguage,
  setUserLanguage,
} from "./translationPreferencesService";

export function initTranslationListener(client: Client) {
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      if (reaction.emoji.name !== TRANSLATION_TRIGGER_EMOJI) return;
      if (!reaction.message.inGuild()) return;

      const message = reaction.message;
      if (!message.content) return;

      const ctx = createChildContext({
        source: "discord",
        guildId: message.guildId ?? undefined,
        userId: user.id,
      });

      const l = log.ctx(ctx);

      const guildId = message.guildId!;
      const userId = user.id;

      const savedLang = await getUserLanguage(guildId, userId);

      // =============================
      // AUTO TRANSLATE
      // =============================
      if (savedLang) {
        const translated = await translateText(
          message.content,
          savedLang
        );

        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `🌍 Translation (${savedLang.toUpperCase()})\n\n"${translated}"`
              )
              .setColor("Green"),
          ],
        });

        return;
      }

      // =============================
      // FIRST TIME → SHOW UI
      // =============================

      const embed = new EmbedBuilder()
        .setDescription(`"${message.content}"`)
        .setFooter({ text: "Choose your language" });

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
        components: rows,
      });

      const collector = panel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000,
      });

      collector.on("collect", async (interaction: Interaction) => {
        if (!interaction.isButton()) return;

        const parts = interaction.customId.split("_");
        const langCode = parts[2];

        await setUserLanguage(guildId, userId, langCode);

        const translated = await translateText(
          message.content,
          langCode
        );

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `🌍 Translation (${langCode.toUpperCase()})\n\n"${translated}"`
              )
              .setColor("Green"),
          ],
          ephemeral: true,
        });
      });
    } catch {
      // silent
    }
  });
}