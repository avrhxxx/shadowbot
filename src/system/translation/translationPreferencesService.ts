// =====================================
// 📁 src/system/translation/translationPreferencesService.ts
// =====================================

import { SheetRepository } from "@/integrations/google";
import { TRANSLATE_SHEET } from "@/integrations/google/googleSheetsSchema";

type TranslateRow = {
  id?: string;
  guildId: string;
  key: string;   // userId
  lang: string;
  value?: string;
};

const repo = new SheetRepository<TranslateRow>(TRANSLATE_SHEET);

export async function getUserLanguage(
  guildId: string,
  userId: string
): Promise<string | null> {
  const results = await repo.findAll({
    guildId,
    key: userId
  });

  return results[0]?.lang ?? null;
}

export async function setUserLanguage(
  guildId: string,
  userId: string,
  lang: string
): Promise<void> {
  const existing = await repo.findAll({
    guildId,
    key: userId
  });

  if (existing.length > 0 && existing[0].id) {
    await repo.updateById(existing[0].id, { lang });
    return;
  }

  await repo.create({
    guildId,
    key: userId,
    lang
  });
}