// =====================================
// 📁 src/systems/translation/translationPreferencesService.ts
// =====================================

import { SheetRepository } from "@/integrations/google";
import { TRANSLATE_SHEET } from "@/integrations/google/googleSheetsSchema";
import { LANGUAGES } from "./translationConfig";

// =====================================
// 🔧 TYPES
// =====================================

type TranslateRow = {
  id?: string;
  guildId: string;
  key: string; // userId
  lang: string;
};

// =====================================
// 🔧 REPO
// =====================================

const repo = new SheetRepository<TranslateRow>(TRANSLATE_SHEET);

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
    guildId,
    key: userId,
    lang,
  });
}