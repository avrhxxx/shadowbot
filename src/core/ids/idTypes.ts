// =====================================
// 📁 src/core/ids/idTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Defines all branded ID types used across the system.
 *
 * ❗ RULES:
 * - NEVER use plain string for IDs
 * - ALWAYS use branded types
 * - This file contains ONLY types (no logic)
 */

// =====================================
// 🔹 BRAND UTILITY
// =====================================

export type Brand<K, T extends string> = K & { readonly __brand: T };

// =====================================
// 🔹 CORE IDS
// =====================================

export type TraceId = Brand<string, "TraceId">;
export type SessionId = Brand<string, "SessionId">;
export type QueueId = Brand<string, "QueueId">;
export type JobId = Brand<string, "JobId">;
export type InteractionId = Brand<string, "InteractionId">;
export type ExternalId = Brand<string, "ExternalId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type FlowId = Brand<string, "FlowId">;

// =====================================
// 🔹 RUNTIME IDS
// =====================================

/**
 * 🔥 INTERNAL ONLY
 * Used strictly inside runtime layer.
 * NEVER exposed outside runtime.
 */
export type RuntimeId = Brand<string, "RuntimeId">;

// =====================================
// 🔹 GENERIC TYPE MAP (FUTURE-PROOF)
// =====================================

export interface IdTypeMap {
  trace: TraceId;
  session: SessionId;
  queue: QueueId;
  job: JobId;
  interaction: InteractionId;
  external: ExternalId;
  correlation: CorrelationId;
  flow: FlowId;
  runtime: RuntimeId;
}