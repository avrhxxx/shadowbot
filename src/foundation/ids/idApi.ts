// =====================================
// 📁 src/foundation/ids/idApi.ts
// =====================================

/**
 * 🧠 ROLE:
 * Public API for working with IDs.
 *
 * 📥 INPUT:
 * - IdType
 * - string IDs
 *
 * 📤 OUTPUT:
 * - typed IDs
 * - validation results
 * - formatted IDs
 *
 * ❗ RULES:
 * - acts as FACADE
 * - uses generator + validator + formatter
 * - NO duplication of logic
 */

import { generateId } from "./idGenerator";
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
// 🔹 CREATE
// =====================================

function create<T extends IdType>(type: T): IdMap[T] {
  return generateId(type) as IdMap[T];
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