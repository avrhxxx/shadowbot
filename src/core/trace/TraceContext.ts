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