// src/quickadd/debug/DebugLogger.ts

const DEBUG_ENABLED = true;

type DebugScope =
  | "OCR"
  | "PIPELINE"
  | "PARSER"
  | "DETECT"
  | "MAPPING"
  | "INTEGRATION"
  | "SESSION";

export function debug(
  scope: DebugScope,
  tag: string,
  ...args: any[]
) {
  if (!DEBUG_ENABLED) return;

  console.log(`[QA:${scope}:${tag}]`, ...args);
}

export function debugError(
  scope: DebugScope,
  tag: string,
  error: any
) {
  if (!DEBUG_ENABLED) return;

  console.error(`[QA:${scope}:${tag}]`, error);
}