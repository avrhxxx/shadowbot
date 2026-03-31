// =====================================
// 📁 src/foundation/ids/idGenerator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Generates new IDs (pure, no prefixes)
 *
 * 📤 OUTPUT:
 * - nanoid string (clean)
 *
 * ❗ RULES:
 * - NO prefixes (trace:, flow:, etc.)
 * - NO formatting
 * - ONLY generation
 */

import { nanoid } from "nanoid";
import { ID_LENGTH } from "./idConfig";

// =====================================
// 🔹 CORE GENERATOR
// =====================================

export function generateId(): string {
  return nanoid(ID_LENGTH);
}

// =====================================
// 🔹 TYPE-SAFE HELPERS
// =====================================

export const createTraceId = () => generateId();
export const createCorrelationId = () => generateId();
export const createFlowId = () => generateId();

// (future ready)
export const createSessionId = () => generateId();
export const createInteractionId = () => generateId();
export const createJobId = () => generateId();
export const createExternalId = () => generateId();