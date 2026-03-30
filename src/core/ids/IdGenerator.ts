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
export type JobId = Brand<string, "JobId">;
export type InteractionId = Brand<string, "InteractionId">;
export type ExternalId = Brand<string, "ExternalId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type FlowId = Brand<string, "FlowId">;

// =====================================
// 🔹 INTERNAL CONFIG
// =====================================

// ❗ ID FORMAT: <prefix>-<8char uuid>
// - NEVER rely on prefix in business logic
// - prefix is ONLY for debugging / observability

const ID_LENGTH = 8;

function generate(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, ID_LENGTH)}`;
}

// =====================================
// 🔥 PUBLIC GENERATORS
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

export function createJobId(): JobId {
  return generate("j") as JobId;
}

export function createInteractionId(): InteractionId {
  return generate("i") as InteractionId;
}

export function createExternalId(): ExternalId {
  return generate("x") as ExternalId;
}

export function createCorrelationId(): CorrelationId {
  return generate("c") as CorrelationId;
}

export function createFlowId(): FlowId {
  return generate("f") as FlowId;
}

// =====================================
// 🔒 TYPE GUARDS
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

export function isJobId(id: string): id is JobId {
  return typeof id === "string" && id.startsWith("j-");
}

export function isInteractionId(id: string): id is InteractionId {
  return typeof id === "string" && id.startsWith("i-");
}

export function isExternalId(id: string): id is ExternalId {
  return typeof id === "string" && id.startsWith("x-");
}

export function isCorrelationId(id: string): id is CorrelationId {
  return typeof id === "string" && id.startsWith("c-");
}

export function isFlowId(id: string): id is FlowId {
  return typeof id === "string" && id.startsWith("f-");
}

// =====================================
// 🧠 GENERIC HELPERS
// =====================================

export function isValidId(id: string): boolean {
  return /^[a-z]-[a-f0-9]{8}$/.test(id);
}

/**
 * 🔹 Debug helper ONLY
 */
export function getIdType(id: string): string | null {
  if (!isValidId(id)) return null;

  const prefix = id[0];

  switch (prefix) {
    case "t":
      return "trace";
    case "s":
      return "session";
    case "q":
      return "queue";
    case "j":
      return "job";
    case "i":
      return "interaction";
    case "x":
      return "external";
    case "c":
      return "correlation";
    case "f":
      return "flow";
    default:
      return null;
  }
}

// =====================================
// 🔗 CORRELATION HELPERS
// =====================================

/**
 * 🔹 Creates correlationId linked to existing trace
 * (semantic helper — not strict binding)
 */
export function createCorrelationFromTrace(): CorrelationId {
  return createCorrelationId();
}

// =====================================
// 🧠 DISPLAY HELPERS (LOGGING ONLY)
// =====================================

function extractSuffix(id: string): string | null {
  if (typeof id !== "string") return null;

  const parts = id.split("-");
  if (parts.length < 2) return null;

  return parts[1] ?? null;
}

export function toDisplayId(id: string, length = 4): string {
  const suffix = extractSuffix(id);
  if (!suffix) return id;

  return suffix.slice(0, length);
}

// =====================================
// 🔹 TYPED DISPLAY HELPERS
// =====================================

export const toDisplayTraceId = (id: TraceId, l = 4) => `t-${toDisplayId(id, l)}`;
export const toDisplaySessionId = (id: SessionId, l = 4) => `s-${toDisplayId(id, l)}`;
export const toDisplayQueueId = (id: QueueId, l = 4) => `q-${toDisplayId(id, l)}`;
export const toDisplayJobId = (id: JobId, l = 4) => `j-${toDisplayId(id, l)}`;
export const toDisplayInteractionId = (id: InteractionId, l = 4) => `i-${toDisplayId(id, l)}`;
export const toDisplayExternalId = (id: ExternalId, l = 4) => `x-${toDisplayId(id, l)}`;
export const toDisplayCorrelationId = (id: CorrelationId, l = 4) => `c-${toDisplayId(id, l)}`;
export const toDisplayFlowId = (id: FlowId, l = 4) => `f-${toDisplayId(id, l)}`;