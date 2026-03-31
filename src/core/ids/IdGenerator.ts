// =====================================
// 📁 src/core/ids/idGenerator.ts
// =====================================

import { customAlphabet } from "nanoid";
import {
  ID_LENGTH,
  ID_PREFIX_MAP,
} from "./idConfig.js";

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
// 🔹 ALPHABET
// =====================================

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

// nanoid generator
const nano = customAlphabet(ALPHABET, ID_LENGTH);

// =====================================
// 🔹 INTERNAL GENERATOR
// =====================================

function generate(prefix: string): string {
  return `${prefix}-${nano()}`;
}

// =====================================
// 🔹 PUBLIC API
// =====================================

export const createTraceId = () =>
  generate(ID_PREFIX_MAP.trace) as TraceId;

export const createSessionId = () =>
  generate(ID_PREFIX_MAP.session) as SessionId;

export const createQueueId = () =>
  generate(ID_PREFIX_MAP.queue) as QueueId;

export const createJobId = () =>
  generate(ID_PREFIX_MAP.job) as JobId;

export const createInteractionId = () =>
  generate(ID_PREFIX_MAP.interaction) as InteractionId;

export const createExternalId = () =>
  generate(ID_PREFIX_MAP.external) as ExternalId;

export const createCorrelationId = () =>
  generate(ID_PREFIX_MAP.correlation) as CorrelationId;

export const createFlowId = () =>
  generate(ID_PREFIX_MAP.flow) as FlowId;