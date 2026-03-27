// =====================================
// 📁 src/quickadd/debug/Metrics.ts
// =====================================

import { LOGGER_CONFIG } from "./LoggerConfig";

const counters = new Map<string, number>();

export const metrics = {
  increment(name: string, value = 1) {
    if (!LOGGER_CONFIG.ENABLE_METRICS) return;

    const current = counters.get(name) || 0;
    counters.set(name, current + value);
  },

  get(name: string): number {
    return counters.get(name) || 0;
  },

  dump() {
    return Object.fromEntries(counters.entries());
  },

  reset() {
    counters.clear();
  },
};