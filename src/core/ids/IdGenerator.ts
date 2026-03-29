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
// 🔹 GENERATORS
// =====================================

function generate(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
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