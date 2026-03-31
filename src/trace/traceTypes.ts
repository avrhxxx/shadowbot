// =====================================
// 📁 src/trace/traceTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Defines TraceContext structure (system flow identity)
 *
 * INPUT:
 * - used across entire system
 *
 * OUTPUT:
 * - strongly typed immutable context
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
// 🔹 SOURCE
// =====================================

export type TraceSource =
  | "discord"
  | "system"
  | "worker"
  | "api"
  | "cron"
  | "external";

// =====================================
// 🔹 SYSTEM
// =====================================

export type TraceSystem =
  | "app"
  | "events"
  | "absence"
  | "points"
  | "quickadd";

// =====================================
// 🔹 TRACE CONTEXT
// =====================================

export type TraceContext = Readonly<{
  // core chain
  traceId: TraceId;
  parentTraceId?: TraceId;

  // correlation layer
  correlationId: CorrelationId;
  flowId?: FlowId;

  // origin
  source: TraceSource;
  system?: TraceSystem;

  // user/session
  userId?: string;
  sessionId?: SessionId;

  // discord context
  guildId?: string;
  channelId?: string;
  messageId?: string;

  interactionId?: InteractionId;

  // async systems
  jobId?: JobId;

  // external
  externalId?: ExternalId;
}>;