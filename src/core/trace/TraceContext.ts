// =====================================
// 📁 src/core/trace/TraceContext.ts
// =====================================

import type { TraceId } from "../ids/IdGenerator";

/**
 * 🔍 TraceContext
 *
 * - immutable context passed through system flows
 * - used for logging, tracing and observability
 * - SHOULD NOT be mutated after creation
 */

// =====================================
// 🔹 SYSTEM DOMAIN (CENTRALIZED)
// =====================================

export type SystemType =
  | "events"
  | "absence"
  | "points"
  | "quickadd";

// =====================================
// 🔹 TRACE CONTEXT
// =====================================

export type TraceContext = Readonly<{
  traceId: TraceId;

  // 🔹 origin of execution
  source: "discord" | "system" | "worker";

  // 🔹 system domain
  system?: SystemType;

  // 🔹 optional user context
  userId?: string;

  // 🔹 optional discord context
  guildId?: string;
  channelId?: string;
  messageId?: string;

  // 🔹 optional session / flow context
  sessionId?: string;
}>;