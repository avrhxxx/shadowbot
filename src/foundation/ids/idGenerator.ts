// =====================================
// 📁 src/foundation/ids/idGenerator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Generates new IDs.
 *
 * 📥 INPUT:
 * - IdType (e.g. "trace", "flow")
 *
 * 📤 OUTPUT:
 * - string ID in format: type:nanoid
 *
 * ❗ RULES:
 * - NO validation
 * - NO formatting logic
 * - ONLY generation
 */

import { nanoid } from "nanoid";
import { ID_LENGTH, IdType } from "./idConfig";

// =====================================
// 🔹 GENERATOR
// =====================================

export function generateId(type: IdType): string {
  return `${type}:${nanoid(ID_LENGTH)}`;
}