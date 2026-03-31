// =====================================
// 📁 src/foundation/ids/idFormatter.ts
// =====================================

/**
 * 🧠 ROLE:
 * Formats IDs for output (logs / UI).
 *
 * 📥 INPUT:
 * - string ID
 *
 * 📤 OUTPUT:
 * - formatted string
 *
 * ❗ RULES:
 * - NO mutation
 * - formatting only
 */

// =====================================
// 🔹 FULL FORMAT (DEFAULT)
// =====================================

export function formatId(id: string): string {
  return id; // full ID (decision: no shortening in logs)
}

// =====================================
// 🔹 SHORT FORMAT (OPTIONAL)
// =====================================

export function shortId(id: string, length = 4): string {
  const [, value] = id.split(":");
  if (!value) return id;

  return value.slice(0, length);
}