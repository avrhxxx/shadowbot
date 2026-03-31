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
} from "@/foundation/ids/idGenerator";

import type { TraceContext } from "./traceTypes";

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
// 🌍 APP CONTEXT (ENTRYPOINT)
// =====================================

/**
 * 🧠 ROLE:
 * Root context for entire application lifecycle
 *
 * ❗ ALWAYS use this in src/index.ts
 */
export function createAppContext(): TraceContext {
  return createRootContext({
    source: "system",
    system: "app",
  });
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