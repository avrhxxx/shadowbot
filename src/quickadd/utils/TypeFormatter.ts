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
  if (!type) return "Unknown";

  const cleaned = type
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

  if (!cleaned) return "Unknown";

  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}