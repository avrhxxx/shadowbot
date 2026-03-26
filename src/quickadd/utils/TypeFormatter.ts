// =====================================
// 📁 src/quickadd/utils/TypeFormatter.ts
// =====================================

/**
 * 🔧 ROLE:
 * Formats internal enum-like types into human-readable labels.
 *
 * Example:
 * DONATIONS_POINTS → Donations Points
 *
 * ❗ RULES:
 * - pure function
 * - no dependencies
 */

export function formatType(type: string): string {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}