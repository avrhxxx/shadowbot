// =====================================
// 📁 src/quickadd/core/IdGenerator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Centralized ID generator for QuickAdd system.
 *
 * Responsibilities:
 * - generate traceId (per command execution)
 * - generate sessionId (per session lifecycle)
 * - provide deterministic displayId mapping
 *
 * ❗ RULES:
 * - pure utility (no external dependencies)
 * - NO logging
 * - deterministic structure
 * - UUID ensures uniqueness
 * - counter scoped per DAY
 *
 * FORMAT:
 * realId   → s-17031200-01-uuid
 * display  → S-17031200-01-550e
 */

// =====================================
// 🔹 INTERNAL STATE (IN-MEMORY)
// =====================================

const counters = new Map<string, number>(); // key = DDMM

// =====================================
// 🔹 HELPERS
// =====================================

function pad(value: number, length: number): string {
  return value.toString().padStart(length, "0");
}

function getTimestampParts() {
  const now = new Date();

  const dd = pad(now.getDate(), 2);
  const mm = pad(now.getMonth() + 1, 2);
  const hh = pad(now.getHours(), 2);
  const min = pad(now.getMinutes(), 2);

  return {
    dayMonth: `${dd}${mm}`,        // do countera
    hourMinute: `${hh}${min}`,     // do ID
    counterKey: `${dd}${mm}`,      // ✅ RESET PER DAY
  };
}

function nextCounter(key: string): string {
  const current = counters.get(key) ?? 0;
  const next = current + 1;

  counters.set(key, next);

  return pad(next, 2);
}

function generateUUID(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// =====================================
// 🔥 CORE BUILDER
// =====================================

function buildId(prefix: "s" | "t"): string {
  const { dayMonth, hourMinute, counterKey } = getTimestampParts();

  const counter = nextCounter(counterKey);
  const uuid = generateUUID();

  // format: s-17031200-01-uuid
  return `${prefix}-${dayMonth}${hourMinute}-${counter}-${uuid}`;
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export function createSessionId(): string {
  return buildId("s");
}

export function createTraceId(): string {
  return buildId("t");
}

// =====================================
// 🔹 DISPLAY (PURE TRANSFORM)
// =====================================

export function toDisplayId(realId: string): string {
  const parts = realId.split("-");

  if (parts.length < 4) {
    throw new Error(`Invalid ID format: ${realId}`);
  }

  const prefix = parts[0].toUpperCase();
  const timestamp = parts[1];
  const counter = parts[2];
  const uuidPart = parts[3].slice(0, 4);

  // format: S-17031200-01-550e
  return `${prefix}-${timestamp}-${counter}-${uuidPart}`;
}