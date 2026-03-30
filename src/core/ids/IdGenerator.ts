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

export const createTraceId = () => generate(ID_PREFIX_MAP.trace) as TraceId;
export const createSessionId = () => generate(ID_PREFIX_MAP.session) as SessionId;
export const createQueueId = () => generate(ID_PREFIX_MAP.queue) as QueueId;
export const createJobId = () => generate(ID_PREFIX_MAP.job) as JobId;
export const createInteractionId = () => generate(ID_PREFIX_MAP.interaction) as InteractionId;
export const createExternalId = () => generate(ID_PREFIX_MAP.external) as ExternalId;
export const createCorrelationId = () => generate(ID_PREFIX_MAP.correlation) as CorrelationId;
export const createFlowId = () => generate(ID_PREFIX_MAP.flow) as FlowId;

// =====================================
// 🔒 TYPE GUARDS
// =====================================

export const isTraceId = (id: string): id is TraceId =>
  id.startsWith(`${ID_PREFIX_MAP.trace}-`);

export const isSessionId = (id: string): id is SessionId =>
  id.startsWith(`${ID_PREFIX_MAP.session}-`);

export const isQueueId = (id: string): id is QueueId =>
  id.startsWith(`${ID_PREFIX_MAP.queue}-`);

export const isJobId = (id: string): id is JobId =>
  id.startsWith(`${ID_PREFIX_MAP.job}-`);

export const isInteractionId = (id: string): id is InteractionId =>
  id.startsWith(`${ID_PREFIX_MAP.interaction}-`);

export const isExternalId = (id: string): id is ExternalId =>
  id.startsWith(`${ID_PREFIX_MAP.external}-`);

export const isCorrelationId = (id: string): id is CorrelationId =>
  id.startsWith(`${ID_PREFIX_MAP.correlation}-`);

export const isFlowId = (id: string): id is FlowId =>
  id.startsWith(`${ID_PREFIX_MAP.flow}-`);

// =====================================
// 🧠 GENERIC HELPERS
// =====================================

export function isValidId(id: string): boolean {
  return new RegExp(`^[${Object.values(ID_PREFIX_MAP).join("")}]-[a-f0-9]{8}$`).test(id);
}

export function getIdType(id: string): keyof typeof ID_PREFIX_MAP | null {
  if (!isValidId(id)) return null;

  const prefix = id[0] as IdPrefix;

  const entry = Object.entries(ID_PREFIX_MAP).find(
    ([, value]) => value === prefix
  );

  return entry ? (entry[0] as keyof typeof ID_PREFIX_MAP) : null;
}

// =====================================
// 🧠 DISPLAY HELPERS
// =====================================

function extractSuffix(id: string): string | null {
  const parts = id.split("-");
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