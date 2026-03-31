// =====================================
// 📁 src/foundation/ids/idApi.ts
// =====================================

import {
  createTraceId,
  createFlowId,
  createCorrelationId,
  createSessionId,
  createJobId,
  createInteractionId,
  createExternalId,
} from "./idGenerator";

import { isValidId, getIdType, isIdOfType } from "./idValidator";
import { formatId, shortId } from "./idFormatter";

import type {
  TraceId,
  FlowId,
  CorrelationId,
  SessionId,
  JobId,
  QueueId,
  InteractionId,
  ExternalId,
  RuntimeId,
} from "./idTypes";

import type { IdType } from "./idConfig";

// =====================================
// 🔹 TYPE MAP
// =====================================

type IdMap = {
  trace: TraceId;
  flow: FlowId;
  correlation: CorrelationId;

  session: SessionId;
  job: JobId;
  queue: QueueId;

  interaction: InteractionId;
  external: ExternalId;

  runtime: RuntimeId;
};

// =====================================
// 🔹 GENERATOR MAP (🔥 KLUCZOWE)
// =====================================

const GENERATORS: Record<IdType, () => string> = {
  trace: createTraceId,
  flow: createFlowId,
  correlation: createCorrelationId,

  session: createSessionId,
  job: createJobId,
  queue: createJobId, // 👉 jeśli nie masz createQueueId — tymczasowo

  interaction: createInteractionId,
  external: createExternalId,

  runtime: createExternalId, // 👉 fallback (możemy później zrobić proper)
};

// =====================================
// 🔹 CREATE
// =====================================

function create<T extends IdType>(type: T): IdMap[T] {
  const generator = GENERATORS[type];

  if (!generator) {
    throw new Error(`No generator for ID type: ${type}`);
  }

  return generator() as IdMap[T];
}

// =====================================
// 🔹 PUBLIC API
// =====================================

export const ids = {
  create,

  validate: isValidId,
  getType: getIdType,
  is: isIdOfType,

  format: formatId,
  short: shortId,
};