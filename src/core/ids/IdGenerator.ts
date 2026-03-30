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

const ID_PREFIX_MAP = {
  trace: "t",
  session: "s",
  queue: "q",
  job: "j",
  interaction: "i",
  external: "x",
  correlation: "c",
  flow: "f",
} as const;

type IdPrefix = typeof ID_PREFIX_MAP[keyof typeof ID_PREFIX_MAP];

function generate(prefix: IdPrefix): string {
  return `${prefix}-${randomUUID().slice(0, ID_LENGTH)}`;
}

// =====================================
// 🔥 PUBLIC GENERATORS
// =====================================

export function createTraceId(): TraceId {
  return generate(ID_PREFIX_MAP.trace) as TraceId;
}

export function createSessionId(): SessionId {
  return generate(ID_PREFIX_MAP.session) as SessionId;
}

export function createQueueId(): QueueId {
  return generate(ID_PREFIX_MAP.queue) as QueueId;
}

export function createJobId(): JobId {
  return generate(ID_PREFIX_MAP.job) as JobId;
}

export function createInteractionId(): InteractionId {
  return generate(ID_PREFIX_MAP.interaction) as InteractionId;
}

export function createExternalId(): ExternalId {
  return generate(ID_PREFIX_MAP.external) as ExternalId;
}

export function createCorrelationId(): CorrelationId {
  return generate(ID_PREFIX_MAP.correlation) as CorrelationId;
}

export function createFlowId(): FlowId {
  return generate(ID_PREFIX_MAP.flow) as FlowId;
}

// =====================================
// 🔒 TYPE GUARDS
// =====================================

export function isTraceId(id: string): id is TraceId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.trace}-`);
}

export function isSessionId(id: string): id is SessionId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.session}-`);
}

export function isQueueId(id: string): id is QueueId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.queue}-`);
}

export function isJobId(id: string): id is JobId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.job}-`);
}

export function isInteractionId(id: string): id is InteractionId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.interaction}-`);
}

export function isExternalId(id: string): id is ExternalId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.external}-`);
}

export function isCorrelationId(id: string): id is CorrelationId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.correlation}-`);
}

export function isFlowId(id: string): id is FlowId {
  return typeof id === "string" && id.startsWith(`${ID_PREFIX_MAP.flow}-`);
}

// =====================================
// 🧠 GENERIC HELPERS
// =====================================

export function isValidId(id: string): boolean {
  return new RegExp(`^[${Object.values(ID_PREFIX_MAP).join("")}]-[a-f0-9]{8}$`).test(id);
}

/**
 * 🔹 Debug helper ONLY
 */
export function getIdType(id: string): keyof typeof ID_PREFIX_MAP | null {
  if (!isValidId(id)) return null;

  const prefix = id[0] as IdPrefix;

  const entry = Object.entries(ID_PREFIX_MAP).find(
    ([, value]) => value === prefix
  );

  return entry ? (entry[0] as keyof typeof ID_PREFIX_MAP) : null;
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

  return suffix.slice(0, Math.min(length, suffix.length));
}

// =====================================
// 🔹 TYPED DISPLAY HELPERS
// =====================================

export const toDisplayTraceId = (id: TraceId, l = 4) =>
  `${ID_PREFIX_MAP.trace}-${toDisplayId(id, l)}`;

export const toDisplaySessionId = (id: SessionId, l = 4) =>
  `${ID_PREFIX_MAP.session}-${toDisplayId(id, l)}`;

export const toDisplayQueueId = (id: QueueId, l = 4) =>
  `${ID_PREFIX_MAP.queue}-${toDisplayId(id, l)}`;

export const toDisplayJobId = (id: JobId, l = 4) =>
  `${ID_PREFIX_MAP.job}-${toDisplayId(id, l)}`;

export const toDisplayInteractionId = (id: InteractionId, l = 4) =>
  `${ID_PREFIX_MAP.interaction}-${toDisplayId(id, l)}`;

export const toDisplayExternalId = (id: ExternalId, l = 4) =>
  `${ID_PREFIX_MAP.external}-${toDisplayId(id, l)}`;

export const toDisplayCorrelationId = (id: CorrelationId, l = 4) =>
  `${ID_PREFIX_MAP.correlation}-${toDisplayId(id, l)}`;

export const toDisplayFlowId = (id: FlowId, l = 4) =>
  `${ID_PREFIX_MAP.flow}-${toDisplayId(id, l)}`;