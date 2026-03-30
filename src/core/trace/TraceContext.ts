// =====================================
// 📁 src/core/trace/TraceContext.ts
// =====================================

import {
  createTraceId,
  createCorrelationId,
  createFlowId,
  type TraceId,
  type SessionId,
  type FlowId,
  type CorrelationId,
  type InteractionId,
  type JobId,
  type ExternalId,
} from "../ids/IdGenerator";

export type SystemType =
  | "app"
  | "events"
  | "absence"
  | "points"
  | "quickadd";

export type SourceType =
  | "discord"
  | "system"
  | "worker"
  | "api"
  | "cron"
  | "external";

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

  createdAt?: number;
}>;

export function createRootContext(input: {
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
}): TraceContext {
  return {
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),
    createdAt: Date.now(),
    ...input,
  };
}

export function createChildContext(
  parent: TraceContext,
  overrides: Partial<TraceContext>
): TraceContext {
  return {
    ...parent,
    parentTraceId: parent.traceId,
    ...overrides,
  };
}