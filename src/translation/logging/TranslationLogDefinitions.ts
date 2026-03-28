// =====================================
// 📁 src/translation/logging/TranslationLogDefinitions.ts
// =====================================

/**
 * 🧾 PLACEHOLDER
 *
 * ❗ CURRENT STATE:
 * - Translation module DOES NOT use Observability yet
 * - This file is a FUTURE SCHEMA definition
 *
 * ✅ HOW TO ENABLE:
 * 1. Uncomment this file
 * 2. Define events
 * 3. Connect with createLogger
 */

export const TranslationLogDefinitions = {
  /*
  TRANSLATION: {
    STARTED: "translation_started",
    DONE: "translation_done",
    FAILED: "translation_failed",
  },

  DETECTION: {
    STARTED: "translation_detection_started",
    DONE: "translation_detection_done",
    FAILED: "translation_detection_failed",
  },
  */
} as const;

/*
export type TranslationLogDefinition =
  (typeof TranslationLogDefinitions)[keyof typeof TranslationLogDefinitions][keyof any];
*/