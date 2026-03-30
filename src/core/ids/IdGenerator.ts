// =====================================
// 📁 src/core/ids/IdGenerator.ts
// =====================================

import { randomUUID } from "crypto";

type Brand<K, T> = K & { __brand: T };

export type TraceId = Brand<string, "TraceId">;
export type SessionId = Brand<string, "SessionId">;
export type QueueId = Brand<string, "QueueId">;
export type JobId = Brand<string, "JobId">;
export type InteractionId = Brand<string, "InteractionId">;
export type ExternalId = Brand<string, "ExternalId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type FlowId = Brand<string, "FlowId">;

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

export const createTraceId = () => generate(ID_PREFIX_MAP.trace) as TraceId;
export const createSessionId = () => generate(ID_PREFIX_MAP.session) as SessionId;
export const createQueueId = () => generate(ID_PREFIX_MAP.queue) as QueueId;
export const createJobId = () => generate(ID_PREFIX_MAP.job) as JobId;
export const createInteractionId = () => generate(ID_PREFIX_MAP.interaction) as InteractionId;
export const createExternalId = () => generate(ID_PREFIX_MAP.external) as ExternalId;
export const createCorrelationId = () => generate(ID_PREFIX_MAP.correlation) as CorrelationId;
export const createFlowId = () => generate(ID_PREFIX_MAP.flow) as FlowId;

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

function extractSuffix(id: string): string | null {
  const parts = id.split("-");
  return parts[1] ?? null;
}

export function toDisplayId(id: string, length = 4): string {
  const suffix = extractSuffix(id);
  if (!suffix) return id;
  return suffix.slice(0, Math.min(length, suffix.length));
}