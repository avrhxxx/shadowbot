// =====================================
// 📁 src/ui/store/ttl.ts
// =====================================

/**
 * 🧠 ROLE:
 * TTL Manager dla UI Store
 *
 * - automatyczne wygaszanie interaction
 * - cleanup pamięci
 * - wspiera ephemeral views
 *
 * ❗ INTERNAL ONLY
 */

import { uiStore } from "./uiStore";

// =====================================
// 🔹 CONFIG
// =====================================

const DEFAULT_TTL = 1000 * 60 * 5; // 5 min
const CLEANUP_INTERVAL = 1000 * 30; // co 30s

// =====================================
// 🔹 INTERNAL STATE
// =====================================

let interval: NodeJS.Timeout | null = null;

// =====================================
// 🔹 START TTL LOOP
// =====================================

export function startTTL() {
  if (interval) return;

  interval = setInterval(() => {
    cleanup();
  }, CLEANUP_INTERVAL);
}

// =====================================
// 🔹 STOP TTL LOOP (opcjonalne)
// =====================================

export function stopTTL() {
  if (!interval) return;

  clearInterval(interval);
  interval = null;
}

// =====================================
// 🔹 REGISTER TTL ENTRY
// =====================================

export function withTTL<T extends { createdAt?: number; ttl?: number }>(
  entry: T,
  ttl?: number
): T {
  return {
    ...entry,
    createdAt: Date.now(),
    ttl: ttl ?? DEFAULT_TTL,
  };
}

// =====================================
// 🔹 CLEANUP
// =====================================

function cleanup() {
  const now = Date.now();

  for (const [key, entry] of uiStore.entries()) {
    const createdAt = entry.createdAt ?? 0;
    const ttl = entry.ttl ?? DEFAULT_TTL;

    if (now - createdAt > ttl) {
      uiStore.delete(key);
    }
  }
}