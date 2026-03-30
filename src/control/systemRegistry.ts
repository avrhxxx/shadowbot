// =====================================
// 📁 src/control/systemRegistry.ts
// =====================================

import { SystemRegistryEntry, SystemName } from "./types";

// =============================
// 🔹 REGISTRY
// =============================

const registry = new Map<SystemName, SystemRegistryEntry>();

// =============================
// 🔹 REGISTER SYSTEM
// =============================

function register(entry: SystemRegistryEntry) {
  registry.set(entry.name, entry);
}

// =============================
// 🔹 GET SYSTEM
// =============================

export function getSystem(name: SystemName): SystemRegistryEntry | undefined {
  return registry.get(name);
}

// =============================
// 🔹 GET ALL SYSTEMS
// =============================

export function getAllSystems(): SystemRegistryEntry[] {
  return Array.from(registry.values());
}

// =============================
// 🔹 INIT REGISTRY (STATIC MAP)
// =============================

export function initSystemRegistry() {
  // 🔥 MODERATOR
  register({
    name: "moderator",
    loader: async () => {
      const mod = await import("@/system/moderator");
      return {
        init: async (client) => {
          if (mod.initModeratorPanel) {
            // ctx będzie w executorze
            await mod.initModeratorPanel(client, undefined as any);
          }
        },
      };
    },
  });

  // 🔥 TRANSLATION
  register({
    name: "translation",
    loader: async () => {
      const mod = await import("@/system/translation");
      return {
        init: async (client) => {
          if (mod.initTranslationListener) {
            mod.initTranslationListener(client);
          }
        },
      };
    },
  });

  // 🔥 EVENTS (placeholder)
  register({
    name: "events",
    loader: async () => {
      const mod = await import("@/system/events");
      return {
        init: async (client) => {
          if (mod.initEvents) {
            await mod.initEvents(client);
          }
        },
      };
    },
  });

  // 🔥 POINTS (placeholder)
  register({
    name: "points",
    loader: async () => {
      const mod = await import("@/system/points");
      return {
        init: async (client) => {
          if (mod.initPoints) {
            await mod.initPoints(client);
          }
        },
      };
    },
  });

  // 🔥 ABSENCE (placeholder)
  register({
    name: "absence",
    loader: async () => {
      const mod = await import("@/system/absence");
      return {
        init: async (client) => {
          if (mod.initAbsence) {
            await mod.initAbsence(client);
          }
        },
      };
    },
  });

  // 🔥 QUICKADD (placeholder)
  register({
    name: "quickadd",
    loader: async () => {
      const mod = await import("@/system/quickadd");
      return {
        init: async (client) => {
          if (mod.initQuickAdd) {
            await mod.initQuickAdd(client);
          }
        },
      };
    },
  });
}