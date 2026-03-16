/* ===========================
   TYPE GUARDS / CHECKERS
=========================== */

/** Czy to Create Week button */
export function isCreateWeek(id: string): boolean {
  return id.startsWith("points_create_week_");
}

/** Czy to kliknięcie tygodnia */
export function isWeek(id: string): boolean {
  return /^points_([^_]+)_week_.+$/.test(id);
}

/** Czy to akcja tygodnia (add/remove/list/compare) */
export function isAction(id: string): boolean {
  return /^points_(add|remove|list|compare)_[^_]+_.+$/.test(id);
}

/* ===========================
   PARSOWANIE CUSTOM ID
=========================== */

/** points_create_week_<category> */
export function parseCreateWeekId(id: string): string {
  return id.replace("points_create_week_", "");
}

/** points_<category>_week_<week> */
export function parseWeekId(id: string) {
  const match = id.match(/^points_([^_]+)_week_(.+)$/);

  if (!match) return { category: "", week: "" };

  return { category: match[1], week: match[2] };
}

/** points_<action>_<category>_<week> */
export function parseActionId(id: string) {
  const match = id.match(/^points_(add|remove|list|compare)_([^_]+)_(.+)$/);

  if (!match) return { action: "", category: "", week: "" };

  return { action: match[1], category: match[2], week: match[3] };
}

/* ===========================
   DYNAMICZNE CUSTOM ID
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