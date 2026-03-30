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
}>;

export function createChildContext(
  parent: TraceContext,
  overrides: Partial<TraceContext>
): TraceContext {
  return {
    ...parent,
    ...overrides,
  };
}