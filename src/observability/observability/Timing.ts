// =====================================
// 📁 src/observability/observability/Timing.ts
// =====================================

const timers = new Map<string, number>();

export const timing = {
  start(id: string) {
    timers.set(id, Date.now());
  },

  end(id: string): number {
    const start = timers.get(id);
    if (!start) return 0;

    const duration = Date.now() - start;
    timers.delete(id);

    return duration;
  },
};