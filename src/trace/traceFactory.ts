// =====================================
// 📁 src/trace/traceFactory.ts
// =====================================

import {
  createTraceId,
  createCorrelationId,
  createFlowId,
  createUIId, // 🔹 NEW
} from "@/foundation/ids/idGenerator";

import type {
  TraceContext,
  TraceId,
  CorrelationId,
  FlowId,
  UIId, // 🔹 NEW
} from "./traceTypes";

// 🔧 CAST HELPERS
const toTraceId = (v: string): TraceId => v as TraceId;
const toCorrelationId = (v: string): CorrelationId => v as CorrelationId;
const toFlowId = (v: string): FlowId => v as FlowId;
const toUIId = (v: string): UIId => v as UIId; // 🔹 NEW

// 🚀 ROOT CONTEXT
export function createRootContext(
  data: Omit<
    TraceContext,
    "traceId" | "parentTraceId" | "correlationId" | "flowId" | "uiId"
  >
): TraceContext {
  return {
    traceId: toTraceId(createTraceId()),
    correlationId: toCorrelationId(createCorrelationId()),
    flowId: toFlowId(createFlowId()),
    uiId: toUIId(createUIId()), // 🔹 NEW
    ...data,
  };
}

// 🌍 APP CONTEXT
export function createAppContext(): TraceContext {
  return createRootContext({
    source: "system",
    system: "app",
  });
}

// 🌿 CHILD CONTEXT
export function createChildContext(
  parent: TraceContext,
  overrides: Partial<TraceContext> = {}
): TraceContext {
  return {
    ...parent,

    traceId: toTraceId(createTraceId()),
    parentTraceId: parent.traceId,
    uiId: toUIId(createUIId()), // 🔹 NEW

    ...overrides,
  };
}

// 🧩 FORK CONTEXT
export function forkContext(
  parent: TraceContext,
  overrides: Partial<TraceContext> = {}
): TraceContext {
  return {
    ...parent,

    traceId: toTraceId(createTraceId()),
    parentTraceId: parent.traceId,

    correlationId: toCorrelationId(createCorrelationId()),
    flowId: toFlowId(createFlowId()),
    uiId: toUIId(createUIId()), // 🔹 NEW

    ...overrides,
  };
}