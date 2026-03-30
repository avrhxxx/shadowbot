// =====================================
// 📁 src/core/trace/TraceContext.ts
// =====================================

import type {
  TraceId,
  SessionId,
  FlowId,
  CorrelationId,
  InteractionId,
  JobId,
  ExternalId,
} from "@/core/ids/IdGenerator";

import {
  createTraceId,
  createCorrelationId,
  createFlowId,
} from "@/core/ids/IdGenerator";

// =====================================
// 🔹 SYSTEM DOMAIN
// =====================================

export type SystemType =
  | "app"
  | "events"
  | "absence"
  | "points"
  | "quickadd";

// =====================================
// 🔹 SOURCE TYPE
// =====================================

export type SourceType =
  | "discord"
  | "system"
  | "worker"
  | "api"
  | "cron"
  | "external";

// =====================================
// 🔹 TRACE CONTEXT
// =====================================

export type TraceContext = Readonly<{
  traceId: TraceId;

  parentTraceId?: TraceId;
  correlationId?: CorrelationId;
  flowId?: FlowId;

  source: SourceType;
  system?: SystemType;

  userId?: string;
  sessionId?: SessionId;

  guildId?: string;
  channelId?: string;
  messageId?: string;

  interactionId?: InteractionId;

  jobId?: JobId;

  externalId?: ExternalId;
}>;

// =====================================
// 🔹 ROOT CONTEXT (ENTRY)
// =====================================

export function createRootContext(
  base: Omit<
    TraceContext,
    "traceId" | "parentTraceId" | "correlationId" | "flowId"
  >
): TraceContext {
  return {
    ...base,
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),
  };
}

// =====================================
// 🔹 CHILD CONTEXT (CHAIN SAFE)
// =====================================

export function createChildContext(
  parent: TraceContext,
  overrides: Partial<
    Omit<
      TraceContext,
      "traceId" | "parentTraceId" | "correlationId" | "flowId"
    >
  >
): TraceContext {
  return {
    ...parent,

    traceId: createTraceId(),
    parentTraceId: parent.traceId,

    correlationId: parent.correlationId ?? createCorrelationId(),
    flowId: parent.flowId ?? createFlowId(),

    ...overrides,
  };
}

// =====================================
// 🚀 APP CONTEXT (BOOTSTRAP)
// =====================================

export function createAppContext(): TraceContext {
  return {
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),
    source: "system",
    system: "app",
  };
}