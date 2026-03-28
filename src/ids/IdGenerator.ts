// =====================================
// 📁 src/ids/IdGenerator.ts
// =====================================

import crypto from "crypto";

// =====================================
// 🔹 TYPES
// =====================================

export type IdType = "trace" | "session" | "queue";

// =====================================
// 🔹 STATE
// =====================================

const counters = new Map<string, number>();
const idDisplayMap = new Map<string, string>();

// =====================================
// 🔹 HELPERS
// =====================================

function getDateKey(): string {
  const now = new Date();

  return `${String(now.getDate()).padStart(2, "0")}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function getDayKey(): string {
  const now = new Date();

  return `${String(now.getDate()).padStart(2, "0")}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getNextCounter(key: string): number {
  const next = (counters.get(key) || 0) + 1;
  counters.set(key, next);
  return next;
}

function pad(num: number): string {
  return String(num).padStart(2, "0");
}

function uuid(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// =====================================
// 🔹 CORE BUILDER
// =====================================

function buildId(type: IdType) {
  const dateKey = getDateKey();
  const dayKey = getDayKey();

  const counterKey = `${type}:${dayKey}`;
  const counter = pad(getNextCounter(counterKey));

  const fullUuid = uuid();
  const shortUuid = fullUuid.slice(0, 6);

  const prefix =
    type === "trace" ? "t" :
    type === "session" ? "s" :
    "q";

  const realId = `${prefix}-${dateKey}-${counter}-${fullUuid}`;
  const displayId = `${prefix.toUpperCase()}-${dateKey}-${counter}-${shortUuid}`;

  idDisplayMap.set(realId, displayId);

  return realId;
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export const createTraceId = () => buildId("trace");
export const createSessionId = () => buildId("session");
export const createQueueId = () => buildId("queue");

// =====================================
// 🔍 DISPLAY RESOLVER
// =====================================

export function resolveDisplayId(realId: string): string {
  return idDisplayMap.get(realId) || realId;
}