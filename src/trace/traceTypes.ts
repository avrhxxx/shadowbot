// =====================================
// 📁 src/trace/traceTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Defines TraceContext structure (system flow identity)
 */

import type {
  TraceId,
  CorrelationId,
  FlowId,
  SessionId,
  InteractionId,
  JobId,
  ExternalId,
} from "@/foundation/ids/idTypes";

// =====================================
// 🔹 RE-EXPORT
// =====================================

export type {
  TraceId,
  CorrelationId,
  FlowId,
  SessionId,
  InteractionId,
  JobId,
  ExternalId,
};

// =====================================
// 🔹 SOURCE
// =====================================

export type TraceSource =
  | "discord"
  | "system"
  | "worker"
  | "api"
  | "cron"
  | "external"
  | "interaction";

// =====================================
// 🔹 SYSTEM (🔥 ROZSZERZONE)
// =====================================

export type TraceSystem =
  // 🔹 APP / CORE
  | "app"

  // 🔹 INFRA / RUNTIME
  | "runtime"
  | "google"

  // 🔹 UI LAYER
  | "ui"

  // 🔹 FEATURES
  | "events"
  | "absence"
  | "points"
  | "quickadd"
  | "test"
  | "translation"; // ✅ 🔥 DODANE

// =====================================
// 🔹 TRACE CONTEXT
// =====================================

export type TraceContext = Readonly<{
  traceId: TraceId;
  parentTraceId?: TraceId;

  correlationId: CorrelationId;
  flowId?: FlowId;

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