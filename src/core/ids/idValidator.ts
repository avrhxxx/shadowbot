// =====================================
// 📁 src/core/ids/idValidator.ts
// =====================================

import { ID_PREFIX_MAP, ID_LENGTH } from "./idConfig.js";

import type {
  TraceId,
  SessionId,
  QueueId,
  JobId,
  InteractionId,
  ExternalId,
  CorrelationId,
  FlowId,
} from "./idTypes.js";

// =====================================
// 🔹 REGEX
// =====================================

const PREFIXES = Object.values(ID_PREFIX_MAP).join("");

const ID_REGEX = new RegExp(
  `^[${PREFIXES}]-[a-z0-9]{${ID_LENGTH}}$`
);

// =====================================
// 🔹 GENERIC
// =====================================

export function isValidId(id: string): boolean {
  return ID_REGEX.test(id);
}

export function getIdType(
  id: string
): keyof typeof ID_PREFIX_MAP | null {
  if (!isValidId(id)) return null;

  const prefix = id[0];

  const entry = Object.entries(ID_PREFIX_MAP).find(
    ([, value]) => value === prefix
  );

  return entry ? (entry[0] as keyof typeof ID_PREFIX_MAP) : null;
}

// =====================================
// 🔹 TYPE GUARDS
// =====================================

const check =
  (prefix: string) =>
  (id: string) =>
    id.startsWith(`${prefix}-`);

export const isTraceId = check(ID_PREFIX_MAP.trace) as (
  id: string
) => id is TraceId;

export const isSessionId = check(ID_PREFIX_MAP.session) as (
  id: string
) => id is SessionId;

export const isQueueId = check(ID_PREFIX_MAP.queue) as (
  id: string
) => id is QueueId;

export const isJobId = check(ID_PREFIX_MAP.job) as (
  id: string
) => id is JobId;

export const isInteractionId = check(
  ID_PREFIX_MAP.interaction
) as (id: string) => id is InteractionId;

export const isExternalId = check(
  ID_PREFIX_MAP.external
) as (id: string) => id is ExternalId;

export const isCorrelationId = check(
  ID_PREFIX_MAP.correlation
) as (id: string) => id is CorrelationId;

export const isFlowId = check(ID_PREFIX_MAP.flow) as (
  id: string
) => id is FlowId;