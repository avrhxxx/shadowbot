// =====================================
// 📁 src/systems/translation/actions/translation.open.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

import { getUserLanguage } from "../translationPreferencesService";
import { translateText } from "../translationService";

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
// 🔹 ACTION: OPEN
// =====================================

registerUIAction("translation.open", {
  system: "translation",

  handler: async (interaction, _ctx, payload) => {
    if (!interaction.isButton()) return;

    const { messageId, content } = payload || {};
    if (!messageId || !content) return;

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
      const translated = await translateText(
        content,
        savedLang
      );

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
      components: buildLanguageButtons(
        messageId,
        content
      ),
      ephemeral: true,
    });
  },
});