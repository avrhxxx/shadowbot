// =====================================
// 📁 src/trace/traceFactory.ts
// =====================================

/**
 * 🧠 ROLE:
 * Creates and propagates TraceContext
 *
 * INPUT:
 * - optional metadata
 *
 * OUTPUT:
 * - fully formed TraceContext
 */

import {
  createTraceId,
  createCorrelationId,
  createFlowId,
} from "@/foundation/ids/idGenerator"; // ✅ FIXED IMPORT

import type { TraceContext } from "./traceTypes";

// =====================================
// 🚀 APP CONTEXT (ENTRY ROOT)
// =====================================

/**
 * Used at application bootstrap
 */
export function createAppContext(): TraceContext {
  return {
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),

    source: "system",
    system: "app",
  };
}

// =====================================
// 🚀 ROOT CONTEXT
// =====================================

export function createRootContext(
  data: Omit<
    TraceContext,
    "traceId" | "parentTraceId" | "correlationId" | "flowId"
  >
): TraceContext {
  return {
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),
    ...data,
  };
}

// =====================================
// 🌿 CHILD CONTEXT
// =====================================

export function createChildContext(
  parent: TraceContext,
  overrides: Partial<TraceContext> = {}
): TraceContext {
  return {
    ...parent,

    // 🔥 NEW TRACE STEP
    traceId: createTraceId(),
    parentTraceId: parent.traceId,

    ...overrides,
  };
}

// =====================================
// 🧩 FORK CONTEXT (NEW FLOW)
// =====================================

export function forkContext(
  parent: TraceContext,
  overrides: Partial<TraceContext> = {}
): TraceContext {
  return {
    ...parent,

    traceId: createTraceId(),
    parentTraceId: parent.traceId,

    // 🔥 NEW FLOW
    correlationId: createCorrelationId(),
    flowId: createFlowId(),

    ...overrides,
  };
}