// =====================================
// 📁 src/foundation/ids/idValidator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Validates and inspects IDs.
 *
 * 📥 INPUT:
 * - string ID
 *
 * 📤 OUTPUT:
 * - boolean / IdType / checks
 *
 * ❗ RULES:
 * - NO mutation
 * - PURE FUNCTIONS ONLY
 */

import { ID_REGEX, IdType } from "./idConfig";

// =====================================
// 🔹 VALIDATION
// =====================================

export function isValidId(id: string): boolean {
  return ID_REGEX.test(id);
}

// =====================================
// 🔹 TYPE RESOLUTION
// =====================================

export function getIdType(id: string): IdType | null {
  if (!isValidId(id)) return null;

  const [type] = id.split(":");
  return type as IdType;
}

// =====================================
// 🔹 TYPE CHECK
// =====================================

export function isIdOfType(id: string, type: IdType): boolean {
  return id.startsWith(`${type}:`);
}