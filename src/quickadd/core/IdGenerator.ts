// =====================================
// 📁 src/quickadd/core/IdGenerator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Centralized ID generator for QuickAdd system.
 *
 * Responsibilities:
 * - generate sessionId (real + display)
 * - generate traceId (real + display)
 * - generate queueId (real + display)
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

const traceCounters = new Map<string, number>();
const sessionCounters = new Map<string, number>();
const queueCounters = new Map<string, number>();

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

function getNextCounter(
  map: Map<string, number>,
  dayKey: string
): number {
  const current = map.get(dayKey) || 0;
  const next = current + 1;

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

  // =====================================
  // 🔥 REAL ID
  // =====================================
  const realId = `${prefix}-${dateKey}-${counterStr}-${uuid}`;

  // =====================================
  // 🔥 DISPLAY ID
  // =====================================
  const displayId = `${prefix.toUpperCase()}-${dateKey}-${counterStr}-${shortUuid}`;

  // =====================================
  // 🔗 MAPPING
  // =====================================
  idDisplayMap.set(realId, displayId);

  return {
    realId,
    displayId,
  };
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export function createTraceId(): string {
  return buildId("t", traceCounters).realId;
}

export function createSessionId(): string {
  return buildId("s", sessionCounters).realId;
}

export function createQueueId(): string {
  return buildId("q", queueCounters).realId;
}

// =====================================
// 🔍 RESOLVER (FOR LOGGER)
// =====================================

export function resolveDisplayId(realId: string): string {
  return idDisplayMap.get(realId) || realId;
}