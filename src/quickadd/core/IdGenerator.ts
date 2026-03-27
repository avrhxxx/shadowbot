// =====================================
// 📁 src/quickadd/core/IdGenerator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Centralized ID generator for QuickAdd system.
 *
 * Responsibilities:
 * - generate sessionId
 * - generate traceId
 * - generate queueId
 * - maintain realId → displayId mapping
 *
 * ❗ RULES:
 * - single source of truth
 * - NO logging
 * - NO external dependencies
 * - deterministic structure
 * - NO systemId → use traceType instead
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

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  return `${dd}${mm}${hh}${min}`;
}

function getDayKey(): string {
  const now = new Date();

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  return `${dd}${mm}`;
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

function buildId(
  prefix: "s" | "t" | "q",
  counterMap: Map<string, number>
) {
  const dateKey = getDateKey();
  const dayKey = getDayKey();

  const counter = getNextCounter(counterMap, dayKey);
  const counterStr = padCounter(counter);

  const uuid = generateUUID();
  const shortUuid = uuid.slice(0, 6);

  const realId = `${prefix}-${dateKey}-${counterStr}-${uuid}`;
  const displayId = `${prefix.toUpperCase()}-${dateKey}-${counterStr}-${shortUuid}`;

  idDisplayMap.set(realId, displayId);

  return realId;
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export function createTraceId(): string {
  return buildId("t", counters.trace);
}

export function createSessionId(): string {
  return buildId("s", counters.session);
}

export function createQueueId(): string {
  return buildId("q", counters.queue);
}

// =====================================
// 🔍 RESOLVER
// =====================================

export function resolveDisplayId(realId: string): string {
  return idDisplayMap.get(realId) || realId;
}