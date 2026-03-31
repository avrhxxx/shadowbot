// =====================================
// 📁 src/core/trace/traceTypes.ts
// =====================================

import type {
  TraceId,
  SessionId,
  FlowId,
  CorrelationId,
  InteractionId,
  JobId,
  ExternalId,
} from "@/core/ids/idTypes.js";

// =====================================
// 🔹 SOURCE
// =====================================

export type SourceType =
  | "discord"
  | "system"
  | "worker"
  | "api"
  | "cron"
  | "external";

// =====================================
// 🔹 DOMAIN (HIGH LEVEL)
// =====================================

export type Domain =
  | "app"
  | "runtime"
  | "events"
  | "absence"
  | "points"
  | "quickadd"
  | "translation"
  | "moderator";

// =====================================
// 🔹 CONTEXT SCOPE (LEVELING)
// =====================================

export type ContextScope =
  | "app"
  | "system"
  | "interaction"
  | "job"
  | "external";

// =====================================
// 🔹 TRACE CONTEXT
// =====================================

export type TraceContext = Readonly<{
  traceId: TraceId;

  parentTraceId?: TraceId;

  // 🔥 STRONG CONTRACT (no optional)
  correlationId: CorrelationId;
  flowId: FlowId;

  source: SourceType;

  domain?: Domain;
  scope?: ContextScope;

  // 🔹 external boundary (string for now)
  userId?: string;
  sessionId?: SessionId;

  guildId?: string;
  channelId?: string;
  messageId?: string;

  interactionId?: InteractionId;

  jobId?: JobId;

  externalId?: ExternalId;
}>;