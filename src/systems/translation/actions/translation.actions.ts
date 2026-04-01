// =====================================
// 📁 src/systems/translation/actions/translation.actions.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

import { getUserLanguage, setUserLanguage } from "../translationPreferencesService";
import { translateText } from "../translationService";

import { LANGUAGES } from "../translationConfig";

// =====================================
// 🔹 HELPERS
// =====================================

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
        custom_id: JSON.stringify({
          action: "translation.select",
          payload: {
            messageId,
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

    const { messageId, content } = payload || {};
    if (!messageId || !content) return;

    const guildId = interaction.guildId!;
    const userId = interaction.user.id;

    const savedLang = await getUserLanguage(guildId, userId);

    // =============================
    // AUTO TRANSLATE
    // =============================
    if (savedLang) {
      const translated = await translateText(content, savedLang);

      await interaction.reply({
        content: `🌍 (${savedLang.toUpperCase()})\n\n"${translated}"`,
        ephemeral: true,
      });

      return;
    }

    // =============================
    // FIRST TIME → SELECT LANGUAGE
    // =============================

    await interaction.reply({
      content: "🌍 Choose your language:",
      components: buildLanguageButtons(messageId),
      ephemeral: true,
    });
  },
});

// =====================================
// 🔹 ACTION: SELECT LANGUAGE
// =====================================

registerUIAction("translation.select", {
  system: "translation",

  handler: async (interaction, _ctx, payload) => {
    if (!interaction.isButton()) return;

    const { messageId, lang, content } = payload || {};
    if (!lang || !content) return;

    const guildId = interaction.guildId!;
    const userId = interaction.user.id;

    await setUserLanguage(guildId, userId, lang);

    const translated = await translateText(content, lang);

    await interaction.update({
      content: `🌍 (${lang.toUpperCase()})\n\n"${translated}"`,
      components: [],
    });
  },
});

// =====================================
// 🔹 ACTION: CHANGE LANGUAGE
// =====================================

registerUIAction("translation.change", {
  system: "translation",

  handler: async (interaction, _ctx, payload) => {
    if (!interaction.isButton()) return;

    const { messageId } = payload || {};
    if (!messageId) return;

    await interaction.reply({
      content: "🌍 Change language:",
      components: buildLanguageButtons(messageId),
      ephemeral: true,
    });
  },
});