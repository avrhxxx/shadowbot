// =====================================
// 📁 src/foundation/ids/idTypes.ts
// =====================================

type Brand<K, T> = K & { __brand: T };

// =====================================
// 🔹 CORE FLOW IDS
export type TraceId = Brand<string, "TraceId">;
export type FlowId = Brand<string, "FlowId">;
export type CorrelationId = Brand<string, "CorrelationId">;

// =====================================
// 🔹 RUNTIME / PROCESS IDS
export type SessionId = Brand<string, "SessionId">;
export type JobId = Brand<string, "JobId">;
export type QueueId = Brand<string, "QueueId">;
export type RuntimeId = Brand<string, "RuntimeId">;

// =====================================
// 🔹 EXTERNAL / INTERACTION IDS
export type InteractionId = Brand<string, "InteractionId">;
export type ExternalId = Brand<string, "ExternalId">;

// =====================================
// 🔹 UI ID
export type UIId = Brand<string, "UIId">;

// =====================================
// 🔹 UNION
export type AnyId =
  | TraceId
  | FlowId
  | CorrelationId
  | SessionId
  | JobId
  | QueueId
  | RuntimeId
  | InteractionId
  | ExternalId
  | UIId;