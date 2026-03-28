// =====================================
// 📁 src/core/ids/IdGenerator.ts
// =====================================

import crypto from "crypto";

export function createTraceId(): string {
  return `t-${crypto.randomUUID()}`;
}

export function createSessionId(): string {
  return `s-${crypto.randomUUID()}`;
}

export function createQueueId(): string {
  return `q-${crypto.randomUUID()}`;
}