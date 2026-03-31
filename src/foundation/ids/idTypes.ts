// =====================================
// 📁 src/foundation/ids/idTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Defines ALL branded ID types used across the system.
 *
 * 📥 INPUT:
 * - string (base primitive)
 *
 * 📤 OUTPUT:
 * - strongly typed branded IDs
 *
 * ❗ RULES:
 * - NO logic
 * - ONLY types
 * - single source of truth for ID typing
 */

// =====================================
// 🔹 BRAND HELPER
// =====================================

type Brand<K, T> = K & { __brand: T };

// =====================================
// 🔹 CORE FLOW IDS
// =====================================

export type TraceId = Brand<string, "TraceId">;
export type FlowId = Brand<string, "FlowId">;
export type CorrelationId = Brand<string, "CorrelationId">;

// =====================================
// 🔹 RUNTIME / PROCESS IDS
// =====================================

export type SessionId = Brand<string, "SessionId">;
export type JobId = Brand<string, "JobId">;
export type QueueId = Brand<string, "QueueId">;
export type RuntimeId = Brand<string, "RuntimeId">;

// =====================================
// 🔹 EXTERNAL / INTERACTION IDS
// =====================================

export type InteractionId = Brand<string, "InteractionId">;
export type ExternalId = Brand<string, "ExternalId">;

// =====================================
// 🔹 UNION
// =====================================

export type AnyId =
  | TraceId
  | FlowId
  | CorrelationId
  | SessionId
  | JobId
  | QueueId
  | RuntimeId
  | InteractionId
  | ExternalId;