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

/** points_create_week_<category> */
export function parseCreateWeekId(id: string): string {
  return id.replace("points_create_week_", "");
}

/** points_<category>_week_<week> */
export function parseWeekId(id: string) {
  const match = id.match(/^points_([^_]+)_week_(.+)$/);
  if (!match) return { category: "", week: "" };
  return { category: match[1], week: decodeURIComponent(match[2]) };
}

/** points_<action>_<category>_<week> */
export function parseActionId(id: string) {
  const match = id.match(/^points_(add|remove|list|compare)_([^_]+)_(.+)$/);
  if (!match) return { action: "", category: "", week: "" };
  return { action: match[1], category: match[2], week: decodeURIComponent(match[3]) };
}