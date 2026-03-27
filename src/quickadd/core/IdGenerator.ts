// =====================================
// 📁 src/quickadd/core/IdGenerator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Centralized ID generator for QuickAdd system.
 *
 * Responsible for:
 * - generating unique IDs:
 *    - sessionId
 *    - traceId
 *    - queueId
 * - maintaining realId → displayId mapping
 *
 * ❗ RULES:
 * - single source of truth
 * - NO logging
 * - NO external dependencies (except crypto)
 * - deterministic structure
 * - NO systemId → use traceType instead
 *
 * ⚠️ NOTE:
 * - displayId is for logs/UI only
 * - NEVER use displayId in logic
 */

import crypto from "crypto";

// =====================================
// 🔹 INTERNAL STATE
// =====================================

const counters = {
  trace: new Map<string, number>(),
  session: new Map<string, number>(),
  queue: new Map<string, number>(),
};

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

function getNextCounter(map: Map<string, number>, dayKey: string): number {
  const next = (map.get(dayKey) || 0) + 1;
  map.set(dayKey, next);
  return next;
}

function padCounter(num: number): string {
  return String(num).padStart(2, "0");
}

function generateUUID(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// =====================================
// 🔹 CORE BUILDER
// =====================================

function buildId(prefix: "s" | "t" | "q", map: Map<string, number>) {
  const dateKey = getDateKey();
  const dayKey = getDayKey();

  const counter = padCounter(getNextCounter(map, dayKey));

  const uuid = generateUUID();
  const shortUuid = uuid.slice(0, 6);

  const realId = `${prefix}-${dateKey}-${counter}-${uuid}`;
  const displayId = `${prefix.toUpperCase()}-${dateKey}-${counter}-${shortUuid}`;

  idDisplayMap.set(realId, displayId);

  return realId;
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export const createTraceId = () => buildId("t", counters.trace);
export const createSessionId = () => buildId("s", counters.session);
export const createQueueId = () => buildId("q", counters.queue);

// =====================================
// 🔍 RESOLVER
// =====================================

export function resolveDisplayId(realId: string): string {
  return idDisplayMap.get(realId) || realId;
}