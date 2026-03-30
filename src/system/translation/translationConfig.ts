// =====================================
// 📁 src/system/translation/translationConfig.ts
// =====================================

/**
 * 🧠 ROLE:
 * Static configuration for translation system
 *
 * Responsibilities:
 * - UI config (emoji, languages)
 * - provider endpoints (no logic)
 *
 * ❗ RULES:
 * - NO logic
 * - NO imports
 * - PURE config only
 */

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

// priority order (service will use this)
export const DEFAULT_PROVIDER_ORDER = [
  "libre",
  "googleFree",
] as const;

// =====================================
// 🔹 LANGUAGES
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
// 🔹 DERIVED TYPES
// =====================================

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

// =====================================
// 🔹 LOOKUP MAP (NO RUNTIME COST)
// =====================================

export const LANGUAGE_MAP: Record<LanguageCode, (typeof LANGUAGES)[number]> =
  Object.fromEntries(
    LANGUAGES.map((l) => [l.code, l])
  ) as Record<LanguageCode, (typeof LANGUAGES)[number]>;