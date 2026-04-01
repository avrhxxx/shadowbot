// =====================================
// 📁 src/systems/translation/actions/translation.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { createLogger } from "@/foundation/logger";

import {
  getUserLanguage,
  setUserLanguage,
} from "../translationPreferences.service";

import { translateText } from "../translation.service";
import { LANGUAGES } from "../translationConfig";

// =====================================
// 🔹 HELPERS
// =====================================

async function fetchMessageContent(
  interaction: any,
  messageId: string
): Promise<string | null> {
  try {
    const channel = interaction.channel;
    if (!channel) return null;

    const message = await channel.messages.fetch(messageId);
    return message?.content ?? null;
  } catch {
    return null;
  }
}

function buildLanguageButtons(messageId: string) {
  const rows: any[] = [];

  for (let i = 0; i < LANGUAGES.length; i += 5) {
    const slice = LANGUAGES.slice(i, i + 5);

    rows.push({
      type: 1,
      components: slice.map((lang) => ({
        type: 2,
        label: lang.label,
        emoji: { name: lang.emoji },
        style: 1,
        custom_id: `translation.select|messageId=${messageId}|lang=${lang.code}`,
      })),
    });
  }

  return rows;
}

// =====================================
// 🔹 ACTION: OPEN
// =====================================

registerUIAction("translation.open", {
  system: "translation",

  handler: async (interaction, ctx, payload) => {
    if (!interaction.isButton()) return;

    const log = createLogger(ctx);
    const flow = log.flow("translation.open");

    flow.start();

    try {
      const messageId = payload?.messageId;
      if (!messageId) {
        flow.fail(new Error("invalid_payload"));
        return;
      }

      const content = await fetchMessageContent(
        interaction,
        messageId
      );

      if (!content) {
        flow.fail(new Error("message_not_found"));
        return;
      }

      const guildId = interaction.guildId!;
      const userId = interaction.user.id;

      const savedLang = await getUserLanguage(
        guildId,
        userId
      );

      if (savedLang) {
        const translated = await translateText(
          content,
          savedLang
        );

        await interaction.reply({
          content: `🌍 (${savedLang.toUpperCase()})\n\n"${translated}"`,
          ephemeral: true,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: "Change language",
                  style: 2,
                  custom_id: `translation.change|messageId=${messageId}`,
                },
              ],
            },
          ],
        });

        flow.success();
        return;
      }

      await interaction.reply({
        content: "🌍 Choose your language:",
        components: buildLanguageButtons(messageId),
        ephemeral: true,
      });

      flow.success();
    } catch (err) {
      flow.fail(err);
    }
  },
});

// =====================================
// 🔹 ACTION: SELECT
// =====================================

registerUIAction("translation.select", {
  system: "translation",

  handler: async (interaction, ctx, payload) => {
    if (!interaction.isButton()) return;

    const log = createLogger(ctx);
    const flow = log.flow("translation.select");

    flow.start();

    try {
      const messageId = payload?.messageId;
      const lang = payload?.lang;

      if (!lang || !messageId) {
        flow.fail(new Error("invalid_payload"));
        return;
      }

      const content = await fetchMessageContent(
        interaction,
        messageId
      );

      if (!content) {
        flow.fail(new Error("message_not_found"));
        return;
      }

      const guildId = interaction.guildId!;
      const userId = interaction.user.id;

      await setUserLanguage(guildId, userId, lang);

      const translated = await translateText(
        content,
        lang
      );

      await interaction.update({
        content: `🌍 (${lang.toUpperCase()})\n\n"${translated}"`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "Change language",
                style: 2,
                custom_id: `translation.change|messageId=${messageId}`,
              },
            ],
          },
        ],
      });

      flow.success();
    } catch (err) {
      flow.fail(err);
    }
  },
});

// =====================================
// 🔹 ACTION: CHANGE
// =====================================

registerUIAction("translation.change", {
  system: "translation",

  handler: async (interaction, ctx, payload) => {
    if (!interaction.isButton()) return;

    const log = createLogger(ctx);
    const flow = log.flow("translation.change");

    flow.start();

    try {
      const messageId = payload?.messageId;

      if (!messageId) {
        flow.fail(new Error("invalid_payload"));
        return;
      }

      await interaction.update({
        content: "🌍 Choose your language:",
        components: buildLanguageButtons(messageId),
      });

      flow.success();
    } catch (err) {
      flow.fail(err);
    }
  },
});