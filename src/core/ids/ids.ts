// =====================================
// 📁 src/core/ids/ids.ts
// =====================================

import { generateId } from "./idGenerator.js";
import { formatId } from "./idFormatter.js";
import { validateId } from "./idValidator.js";
import type { TraceId } from "./idTypes.js";

// =====================================
// 🔥 CREATE TRACE ID
// =====================================

export function createTraceId(): TraceId {
  const raw = generateId();
  const formatted = formatId(raw);

  if (!validateId(formatted)) {
    throw new Error("Invalid TraceId generated");
  }

  return formatted as TraceId;
}

// =====================================
// 🔥 VALIDATE
// =====================================

export function isValidTraceId(id: string): id is TraceId {
  return validateId(id);
}

// =====================================
// 🔥 FORMAT (PUBLIC)
// =====================================

export function toTraceId(id: string): TraceId {
  const formatted = formatId(id);

  if (!validateId(formatted)) {
    throw new Error("Invalid TraceId");
  }

  return formatted as TraceId;
}