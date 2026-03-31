// =====================================
// 📁 src/core/trace/traceFactory.ts
// =====================================

import { ids } from "@/core/ids/ids.js";

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
    traceId: ids.trace.create(),
    correlationId: ids.correlation.create(),
    flowId: ids.flow.create(),
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

    traceId: ids.trace.create(),
    parentTraceId: parent.traceId,

    // 🔥 guaranteed by contract
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
    traceId: ids.trace.create(),
    correlationId: ids.correlation.create(),
    flowId: ids.flow.create(),
    source: "system",
    domain: "app",
    scope: "app",
  };
}