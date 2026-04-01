// =====================================
// 📁 src/systems/translation/translationConfig.ts
// =====================================

// =====================================
// 🔹 TRIGGER
// =====================================

export const TRANSLATION_TRIGGER_EMOJI = "🈯";

// =====================================
// 🔹 PROVIDERS
// =====================================

export const TRANSLATION_PROVIDERS = {
  libre: {
    url:
      process.env.LIBRE_URL ||
      "https://libretranslate-production-26a3.up.railway.app/translate",
  },
  googleFree: {
    url:
      process.env.GOOGLE_URL ||
      "https://translate.googleapis.com/translate_a/single",
  },
  // 🔮 future-ready
  googleCloud: {
    enabled: false,
  },
  deepl: {
    enabled: false,
  },
} as const;

// =====================================
// 🔹 PRIORITY
// =====================================

export const DEFAULT_PROVIDER_ORDER = [
  "libre",
  "googleFree",
] as const;

// =====================================
// 🔹 LANGUAGES (FULL)
// =====================================

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
  { code: "ja", label: "Japanese", emoji: "🇯🇵" },
] as const;

// =====================================
// 🔹 TYPES
// =====================================

export type LanguageCode =
  (typeof LANGUAGES)[number]["code"];