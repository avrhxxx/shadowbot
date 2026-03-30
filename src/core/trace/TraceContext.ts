// =====================================
// 📁 src/core/trace/TraceContext.ts
// =====================================

/**
 * 🧾 FILE DESCRIPTION
 *
 * 📁 Path: src/core/trace/TraceContext.ts
 * 🧠 Role: core type (trace context definition)
 * 📄 Description:
 * Central immutable context passed through all system flows.
 * Used for logging, tracing and observability across the entire application.
 *
 * 📥 Input:
 * - created at entry points (e.g. router, workers, bootstrap)
 *
 * 📤 Output:
 * - passed through services, handlers, pipelines
 *
 * 🔗 Dependencies:
 * - IdGenerator (TraceId)
 *
 * 📡 Used by:
 * - logger
 * - systemRouter
 * - all system modules
 *
 * 🆔 ID flow:
 * - traceId (required)
 * - sessionId (optional)
 *
 * 📊 Logging:
 * - core element for structured logging (log.ctx)
 *
 * ⚠️ Notes:
 * - MUST remain immutable
 * - MUST be passed through entire flow
 * - "app" system added to support bootstrap / entrypoint layer
 */

import type { TraceId } from "../ids/IdGenerator";

// =====================================
// 🔹 SYSTEM DOMAIN (CENTRALIZED)
// =====================================

export type SystemType =
  | "app"       // 🔥 bootstrap / entrypoint (index.ts, init)
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

  // 🔹 system domain (feature / module)
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