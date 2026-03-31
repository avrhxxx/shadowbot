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

import type {
  TraceContext,
  TraceId,
  CorrelationId,
  FlowId,
} from "./traceTypes";

// =====================================
// 🔧 CAST HELPERS (BRANDING)
// =====================================

const toTraceId = (v: string): TraceId => v as TraceId;
const toCorrelationId = (v: string): CorrelationId =>
  v as CorrelationId;
const toFlowId = (v: string): FlowId => v as FlowId;

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
    traceId: toTraceId(createTraceId()), // ✅ FIX
    correlationId: toCorrelationId(createCorrelationId()), // ✅ FIX
    flowId: toFlowId(createFlowId()), // ✅ FIX
    ...data,
  };
}

// =====================================
// 🌍 APP CONTEXT (ENTRYPOINT)
// =====================================

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

    traceId: toTraceId(createTraceId()), // ✅ FIX
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

    traceId: toTraceId(createTraceId()), // ✅ FIX
    parentTraceId: parent.traceId,

    correlationId: toCorrelationId(createCorrelationId()), // ✅ FIX
    flowId: toFlowId(createFlowId()), // ✅ FIX

    ...overrides,
  };
}