// =====================================
// 📁 src/runtime/runtimeTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Typy dla runtime systemu (zarządzanie modułami)
 *
 * INPUT:
 * - używane przez runtimeRegistry / runtimeLoader / runtimeState
 *
 * OUTPUT:
 * - spójne typy dla systemów
 */

// =====================================
// 🔹 SYSTEM NAME
// =====================================

export type SystemName =
  | "moderator"
  | "events"
  | "absence"
  | "points"
  | "quickadd"
  | "quickadd_worker";

// =====================================
// 🔹 SYSTEM TYPE
// =====================================

export type SystemType = "global" | "guild";

// =====================================
// 🔹 SYSTEM MODULE
// =====================================

export type SystemModule = {
  init: (ctx: any) => Promise<void>;
};

// =====================================
// 🔹 REGISTRY ENTRY
// =====================================

export type SystemRegistryEntry = {
  name: SystemName;
  type: SystemType;

  loader: () => Promise<SystemModule>;
};

// =====================================
// 🔹 SYSTEM STATE
// =====================================

export type SystemState = {
  system: SystemName;
  enabled: boolean;
  reason?: string;
};