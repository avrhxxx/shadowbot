// =====================================
// 📁 src/runtime/runtimeRegistry.ts
// =====================================

import type { SystemRegistryEntry } from "./runtimeTypes.js";

// =====================================
// 🔹 REGISTRY
// =====================================

export const systems: SystemRegistryEntry[] = [
  {
    name: "moderator",
    type: "global",
    loader: async () => {
      const mod = await import("../system/moderator.js");
      return { init: mod.initModeratorPanel };
    },
  },
  {
    name: "translation",
    type: "global",
    loader: async () => {
      const mod = await import("../system/translation.js");
      return { init: mod.initTranslationModule };
    },
  },
  {
    name: "events",
    type: "guild",
    loader: async () => {
      const mod = await import("../system/events.js");
      return { init: mod.initEventReminders };
    },
  },
  {
    name: "absence",
    type: "guild",
    loader: async () => {
      const mod = await import("../system/absence.js");
      return { init: mod.initAbsenceNotifications };
    },
  },
  {
    name: "quickadd",
    type: "global",
    loader: async () => {
      const mod = await import("../system/quickadd.js");
      return { init: mod.registerQuickAddListener };
    },
  },
  {
    name: "quickadd_worker",
    type: "global",
    loader: async () => {
      const mod = await import("../system/quickadd.js");
      return { init: mod.startQuickAddWorker };
    },
  },
];