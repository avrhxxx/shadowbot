// =====================================
// 📁 src/trace/traceTypes.ts
// =====================================

import type {
  TraceId,
  CorrelationId,
  FlowId,
  SessionId,
  InteractionId,
  JobId,
  ExternalId,
  UIId, // 🔹 NEW
} from "@/foundation/ids/idTypes";

// 🔹 RE-EXPORT
export type {
  TraceId,
  CorrelationId,
  FlowId,
  SessionId,
  InteractionId,
  JobId,
  ExternalId,
  UIId, // 🔹 NEW
};

// 🔹 SOURCE
export type TraceSource =
  | "discord"
  | "system"
  | "worker"
  | "api"
  | "cron"
  | "external"
  | "interaction";

// 🔹 SYSTEM
export type TraceSystem =
  | "app"
  | "runtime"
  | "google"
  | "ui" // 🔹 UI LAYER
  | "events"
  | "absence"
  | "points"
  | "quickadd"
  | "test"
  | "translation";

// 🔹 TRACE CONTEXT
export type TraceContext = Readonly<{
  traceId: TraceId;
  parentTraceId?: TraceId;

  correlationId: CorrelationId;
  flowId?: FlowId;
  uiId?: UIId; // 🔹 NEW

  source: TraceSource;
  system?: TraceSystem;

  userId?: string;
  sessionId?: SessionId;

  guildId?: string;
  channelId?: string;
  messageId?: string;

  interactionId?: InteractionId;

  jobId?: JobId;
  externalId?: ExternalId;
}>;