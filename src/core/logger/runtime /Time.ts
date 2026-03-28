// =====================================
// 📁 src/core/logger/runtime/Time.ts
// =====================================

export function getTime(): string {
  return new Date()
    .toISOString()
    .split("T")[1]
    .split(".")[0];
}
