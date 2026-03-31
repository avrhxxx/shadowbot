// =====================================
// 🔹 BRAND
// =====================================

type Brand<K, T> = K & { __brand: T };

// =====================================
// 🔹 ID TYPES
// =====================================

export type TraceId = Brand<string, "TraceId">;
export type SessionId = Brand<string, "SessionId">;
export type QueueId = Brand<string, "QueueId">;
export type JobId = Brand<string, "JobId">;
export type InteractionId = Brand<string, "InteractionId">;
export type ExternalId = Brand<string, "ExternalId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type FlowId = Brand<string, "FlowId">;
export type RuntimeId = Brand<string, "RuntimeId">;

// =====================================
// 🔹 UNION
// =====================================

export type AnyId =
  | TraceId
  | SessionId
  | QueueId
  | JobId
  | InteractionId
  | ExternalId
  | CorrelationId
  | FlowId
  | RuntimeId;