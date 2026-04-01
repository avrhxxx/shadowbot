// =====================================
// 📁 src/systems/translation/translationPreferences.service.ts
// =====================================

import { GoogleRepository } from "@/integrations/google";
import { TRANSLATE_SHEET } from "@/integrations/google/googleSchema";
import { LANGUAGES } from "./translationConfig";

// =====================================
// 🔧 TYPES
// =====================================

type TranslateRow = {
  id: string; // 🔥 REQUIRED (GoogleRepository)
  guildId: string;
  key: string; // userId
  lang: string;
};

// =====================================
// 🔧 REPO
// =====================================

const repo = new GoogleRepository<TranslateRow>(
  TRANSLATE_SHEET
);

// =====================================
// 🔍 GET USER LANGUAGE
// =====================================

export async function getUserLanguage(
  guildId: string,
  userId: string
): Promise<string | null> {
  const results = await repo.findAll({
    guildId,
    key: userId,
  });

  if (!results.length) return null;

  return results[0].lang ?? null;
}

// =====================================
// 💾 SET USER LANGUAGE
// =====================================

export async function setUserLanguage(
  guildId: string,
  userId: string,
  lang: string
): Promise<void> {
  // =============================
  // VALIDATE LANGUAGE
  // =============================

  const isValid = LANGUAGES.some((l) => l.code === lang);

  if (!isValid) {
    throw new Error(`Invalid language: ${lang}`);
  }

  // =============================
  // FIND EXISTING
  // =============================

  const existing = await repo.findAll({
    guildId,
    key: userId,
  });

  const first = existing[0];

  // =============================
  // UPDATE
  // =============================

  if (first?.id) {
    await repo.updateById(first.id, { lang });
    return;
  }

  // =============================
  // CREATE
  // =============================

  await repo.create({
    id: `${guildId}_${userId}`, // 🔥 KLUCZ (unikalny)
    guildId,
    key: userId,
    lang,
  });
}