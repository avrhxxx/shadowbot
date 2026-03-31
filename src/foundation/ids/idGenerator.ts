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
// 🔹 CORE GENERATOR
// =====================================

export function generateId(type: IdType): string {
  return `${type}:${nanoid(ID_LENGTH)}`;
}

// =====================================
// 🔹 TYPE-SAFE HELPERS (ADAPTER LAYER)
// =====================================

export const createTraceId = () => generateId("trace");
export const createCorrelationId = () => generateId("correlation");
export const createFlowId = () => generateId("flow");

// (future ready)
export const createSessionId = () => generateId("session");
export const createInteractionId = () => generateId("interaction");
export const createJobId = () => generateId("job");
export const createExternalId = () => generateId("external");