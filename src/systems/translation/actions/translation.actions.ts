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

function buildLanguageButtons(
  messageId: string,
  content: string
) {
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
        custom_id: JSON.stringify({
          action: "translation.select",
          payload: {
            messageId,
            content,
            lang: lang.code,
          },
        }),
      })),
    });
  }

  return rows;
}

// =====================================
// 🔹 ACTION: OPEN (Translate)
// =====================================

registerUIAction("translation.open", {
  system: "translation",

  handler: async (interaction, ctx, payload) => {
    if (!interaction.isButton()) return;

    const log = createLogger(ctx);
    const flow = log.flow("translation.open");

    flow.start();

    try {
      const { messageId, content } = payload || {};
      if (!messageId || !content) {
        flow.fail(new Error("invalid_payload"));
        return;
      }

      const guildId = interaction.guildId!;
      const userId = interaction.user.id;

      const savedLang = await getUserLanguage(
        guildId,
        userId
      );

      // =============================
      // AUTO TRANSLATE
      // =============================
      if (savedLang) {
        flow.stepDebug("auto_translate", {
          meta: { lang: savedLang },
        });

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
                  custom_id: JSON.stringify({
                    action: "translation.change",
                    payload: { messageId, content },
                  }),
                },
              ],
            },
          ],
        });

        flow.success();
        return;
      }

      // =============================
      // FIRST TIME → SELECT LANGUAGE
      // =============================

      flow.stepDebug("select_language");

      await interaction.reply({
        content: "🌍 Choose your language:",
        components: buildLanguageButtons(
          messageId,
          content
        ),
        ephemeral: true,
      });

      flow.success();
    } catch (err) {
      flow.fail(err);
    }
  },
});

// =====================================
// 🔹 ACTION: SELECT LANGUAGE
// =====================================

registerUIAction("translation.select", {
  system: "translation",

  handler: async (interaction, ctx, payload) => {
    if (!interaction.isButton()) return;

    const log = createLogger(ctx);
    const flow = log.flow("translation.select");

    flow.start();

    try {
      const { lang, content } = payload || {};
      if (!lang || !content) {
        flow.fail(new Error("invalid_payload"));
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
                custom_id: JSON.stringify({
                  action: "translation.change",
                  payload: { content },
                }),
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
// 🔹 ACTION: CHANGE LANGUAGE
// =====================================

registerUIAction("translation.change", {
  system: "translation",

  handler: async (interaction, ctx, payload) => {
    if (!interaction.isButton()) return;

    const log = createLogger(ctx);
    const flow = log.flow("translation.change");

    flow.start();

    try {
      const { messageId, content } = payload || {};
      if (!content) {
        flow.fail(new Error("invalid_payload"));
        return;
      }

      await interaction.update({
        content: "🌍 Choose your language:",
        components: buildLanguageButtons(
          messageId,
          content
        ),
      });

      flow.success();
    } catch (err) {
      flow.fail(err);
    }
  },
});