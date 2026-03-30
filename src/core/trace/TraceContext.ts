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
// 🔹 SYSTEM DOMAIN (CENTRALIZED)
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
  // =============================
  // 🧠 CORE
  // =============================

  traceId: TraceId;

  /**
   * 🔗 Parent trace (chain tracking)
   */
  parentTraceId?: TraceId;

  /**
   * 🔗 Cross-system correlation
   */
  correlationId?: CorrelationId;

  /**
   * 🔁 Multi-step flow (long processes)
   */
  flowId?: FlowId;

  /**
   * 🔹 origin of execution
   */
  source: SourceType;

  /**
   * 🔹 system domain (feature / module)
   */
  system?: SystemType;

  // =============================
  // 👤 USER / SESSION
  // =============================

  userId?: string;
  sessionId?: SessionId;

  // =============================
  // 💬 DISCORD CONTEXT
  // =============================

  guildId?: string;
  channelId?: string;
  messageId?: string;

  /**
   * 🔘 internal interaction tracking
   */
  interactionId?: InteractionId;

  // =============================
  // ⚙️ ASYNC / WORKERS
  // =============================

  jobId?: JobId;

  // =============================
  // 🌍 EXTERNAL SYSTEMS
  // =============================

  externalId?: ExternalId;
}>;