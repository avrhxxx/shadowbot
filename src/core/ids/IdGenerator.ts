// =====================================
// 📁 src/core/ids/IdGenerator.ts
// =====================================

import { randomUUID } from "crypto";

// =====================================
// 🔹 TYPES
// =====================================

export type TraceId = string;
export type SessionId = string;
export type QueueId = string;

// =====================================
// 🔹 INTERNAL
// =====================================

// ❗ ID FORMAT: <prefix>-<8char uuid>
// - NEVER parse
// - NEVER derive logic from prefix
// - safe to use in logs / payloads / tracing

function generate(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export function createTraceId(): TraceId {
  return generate("t");
}

export function createSessionId(): SessionId {
  return generate("s");
}

export function createQueueId(): QueueId {
  return generate("q");
}