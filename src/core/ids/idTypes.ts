// =====================================
// 📁 src/core/ids/idTypes.ts
// =====================================

export type Brand<K, T> = K & { __brand: T };

// =====================================
// 🔹 ID TYPES
// =====================================

export type TraceId = Brand<string, "TraceId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type FlowId = Brand<string, "FlowId">;

// (future use)
export type RuntimeId = Brand<string, "RuntimeId">;