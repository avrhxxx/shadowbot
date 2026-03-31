// =====================================
// 📁 src/core/ids/idFormatter.ts
// =====================================

import { ID_PREFIX_MAP } from "./idConfig.js";

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
// 🔹 INTERNAL
// =====================================

function extractSuffix(id: string): string | null {
  const parts = id.split("-");
  return parts[1] ?? null;
}

export function toDisplayId(
  id: string,
  length = 4
): string {
  const suffix = extractSuffix(id);
  if (!suffix) return id;

  return suffix.slice(0, Math.min(length, suffix.length));
}

// =====================================
// 🔹 SPECIALIZED
// =====================================

const format =
  (prefix: string) =>
  (id: string, l = 4) =>
    `${prefix}-${toDisplayId(id, l)}`;

export const toDisplayTraceId = format(ID_PREFIX_MAP.trace) as (
  id: TraceId,
  l?: number
) => string;

export const toDisplaySessionId = format(ID_PREFIX_MAP.session) as (
  id: SessionId,
  l?: number
) => string;

export const toDisplayQueueId = format(ID_PREFIX_MAP.queue) as (
  id: QueueId,
  l?: number
) => string;

export const toDisplayJobId = format(ID_PREFIX_MAP.job) as (
  id: JobId,
  l?: number
) => string;

export const toDisplayInteractionId = format(
  ID_PREFIX_MAP.interaction
) as (id: InteractionId, l?: number) => string;

export const toDisplayExternalId = format(
  ID_PREFIX_MAP.external
) as (id: ExternalId, l?: number) => string;

export const toDisplayCorrelationId = format(
  ID_PREFIX_MAP.correlation
) as (id: CorrelationId, l?: number) => string;

export const toDisplayFlowId = format(ID_PREFIX_MAP.flow) as (
  id: FlowId,
  l?: number
) => string;