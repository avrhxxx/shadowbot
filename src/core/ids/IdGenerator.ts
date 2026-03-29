// =====================================
// 📁 src/core/ids/IdGenerator.ts
// =====================================

import { randomUUID } from "crypto";

// =====================================
// 🔹 BRANDING TYPES (TYPE-SAFE IDS)
// =====================================

type Brand<K, T> = K & { __brand: T };

export type TraceId = Brand<string, "TraceId">;
export type SessionId = Brand<string, "SessionId">;
export type QueueId = Brand<string, "QueueId">;

// =====================================
// 🔹 INTERNAL CONFIG
// =====================================

// ❗ ID FORMAT: <prefix>-<8char uuid>
// - NEVER parse
// - NEVER derive logic from prefix
// - safe to use in logs / payloads / tracing

const ID_LENGTH = 8;

function generate(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, ID_LENGTH)}`;
}

// =====================================
// 🔥 PUBLIC API (ONLY ENTRY POINT)
// =====================================

export function createTraceId(): TraceId {
  return generate("t") as TraceId;
}

export function createSessionId(): SessionId {
  return generate("s") as SessionId;
}

export function createQueueId(): QueueId {
  return generate("q") as QueueId;
}

// =====================================
// 🔒 SAFETY HELPERS
// =====================================

export function isTraceId(id: string): id is TraceId {
  return typeof id === "string" && id.startsWith("t-");
}

export function isSessionId(id: string): id is SessionId {
  return typeof id === "string" && id.startsWith("s-");
}

export function isQueueId(id: string): id is QueueId {
  return typeof id === "string" && id.startsWith("q-");
}