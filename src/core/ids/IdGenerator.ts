// =====================================
// 📁 src/core/ids/idGenerator.ts
// =====================================

import { nanoid } from "nanoid";
import {
  ID_PREFIX_MAP,
  ID_LENGTH,
  type IdPrefix,
} from "./idConfig.js";

// =====================================
// 🔹 BRAND TYPE
// =====================================

type Brand<K, T> = K & { __brand: T };

// =====================================
// 🔹 ID TYPES
// =====================================

export type TraceId = Brand<string, "TraceId">;
export type SessionId = Brand<string, "SessionId">;
export type QueueId = Brand<string, "QueueId">;
export type JobId = Brand<string, "JobId">;
export type InteractionId = Brand<string, "InteractionId">;
export type ExternalId = Brand<string, "ExternalId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type FlowId = Brand<string, "FlowId">;
export type RuntimeId = Brand<string, "RuntimeId">;

// =====================================
// 🔹 INTERNAL GENERATOR
// =====================================

function generate(prefix: IdPrefix): string {
  return `${prefix}-${nanoid(ID_LENGTH)}`;
}

// =====================================
// 🔹 FACTORY FUNCTIONS
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

export const createRuntimeId = () =>
  generate(ID_PREFIX_MAP.runtime) as RuntimeId;