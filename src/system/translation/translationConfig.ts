// =====================================
// 📁 src/system/translation/translationConfig.ts
// =====================================

export const TRANSLATION_TRIGGER_EMOJI = "🈯";

export const LIBRE_URL =
  process.env.LIBRE_URL ||
  "https://libretranslate-production-26a3.up.railway.app/translate";

export const GOOGLE_URL =
  process.env.GOOGLE_URL ||
  "https://translate.googleapis.com/translate_a/single";

export const LANGUAGES = [
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
] as const;