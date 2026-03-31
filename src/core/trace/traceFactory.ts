// =====================================
// 📁 src/core/trace/traceFactory.ts
// =====================================

import {
  createTraceId,
  createCorrelationId,
  createFlowId,
} from "@/core/ids/idGenerator.js";

import type { TraceContext } from "./traceTypes.js";

// =====================================
// 🔹 ROOT CONTEXT
// =====================================

export function createRootContext(
  base: Omit<
    TraceContext,
    "traceId" | "parentTraceId" | "correlationId" | "flowId"
  >
): TraceContext {
  return {
    ...base,
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),
  };
}

// =====================================
// 🔹 CHILD CONTEXT
// =====================================

export function createChildContext(
  parent: TraceContext,
  overrides: Partial<
    Omit<
      TraceContext,
      "traceId" | "parentTraceId" | "correlationId" | "flowId"
    >
  >
): TraceContext {
  return {
    ...parent,

    traceId: createTraceId(),
    parentTraceId: parent.traceId,

    // 🔥 already guaranteed, but keep safe fallback
    correlationId: parent.correlationId,
    flowId: parent.flowId,

    ...overrides,
  };
}

// =====================================
// 🚀 APP CONTEXT
// =====================================

export function createAppContext(): TraceContext {
  return {
    traceId: createTraceId(),
    correlationId: createCorrelationId(),
    flowId: createFlowId(),
    source: "system",
    domain: "app",
    scope: "app",
  };
}