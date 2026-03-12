// src/pointsPanel/pointsButtons/utils.ts

/* ===========================
   PARSOWANIE CUSTOM ID
=========================== */

/**
 * Wyciąga kategorię z customId przycisku: points_add_category_week
 */
export function parseCategoryFromCustomId(customId: string): string {
  const match = customId.match(/^points_(add|remove|list|compare|create)_([^_]+)_?/);
  return match ? match[2] : "";
}

/**
 * Wyciąga tydzień z customId przycisku: points_add_category_week
 */
export function parseWeekFromCustomId(customId: string): string | null {
  const match = customId.match(/^points_(add|remove|list|compare)_[^_]+_(.+)$/);
  return match ? match[2] : null;
}

/* ===========================
   DYNAMICZNE CUSTOM ID BUTTONÓW
=========================== */

/** Add Points */
export function makeAddPointsId(category: string, week: string): string {
  return `points_add_${category}_${week}`;
}

/** Remove Points */
export function makeRemovePointsId(category: string, week: string): string {
  return `points_remove_${category}_${week}`;
}

/** Compare Points */
export function makeComparePointsId(category: string, week: string): string {
  return `points_compare_${category}_${week}`;
}

/** List Points */
export function makeListPointsId(category: string, week: string): string {
  return `points_list_${category}_${week}`;
}

/** Create Week */
export function makeCreateWeekId(category: string): string {
  return `points_create_week_${category}`;
}