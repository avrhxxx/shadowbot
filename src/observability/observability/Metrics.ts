// =====================================
// 📁 src/observability/observability/Metrics.ts
// =====================================

const counters = new Map<string, number>();

export const metrics = {
  increment(name: string, value = 1) {
    const current = counters.get(name) || 0;
    counters.set(name, current + value);
  },

  get(name: string): number {
    return counters.get(name) || 0;
  },

  dump(): Record<string, number> {
    return Object.fromEntries(counters.entries());
  },

  reset() {
    counters.clear();
  },
};