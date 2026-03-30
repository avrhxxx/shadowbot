// =====================================
// 📁 src/runtime/runtimeRegistry.ts
// =====================================

import type { SystemRegistryEntry } from "./runtimeTypes";

// =====================================
// 🔹 REGISTRY
// =====================================

export const systems: SystemRegistryEntry[] = [
  {
    name: "moderator",
    type: "global",
    loader: async () => {
      const mod = await import("@/system/moderator");
      return { init: mod.initModeratorPanel };
    },
  },
  {
    name: "translation",
    type: "global",
    loader: async () => {
      const mod = await import("@/system/translation");
      return { init: mod.initTranslationModule };
    },
  },
  {
    name: "events",
    type: "guild",
    loader: async () => {
      const mod = await import("@/system/events");
      return { init: mod.initEventReminders };
    },
  },
  {
    name: "absence",
    type: "guild",
    loader: async () => {
      const mod = await import("@/system/absence");
      return { init: mod.initAbsenceNotifications };
    },
  },
  {
    name: "quickadd",
    type: "global",
    loader: async () => {
      const mod = await import("@/system/quickadd");
      return { init: mod.registerQuickAddListener };
    },
  },
  {
    name: "quickadd_worker",
    type: "global",
    loader: async () => {
      const mod = await import("@/system/quickadd");
      return { init: mod.startQuickAddWorker };
    },
  },
];