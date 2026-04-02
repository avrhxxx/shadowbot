// =====================================
// 📁 src/systems/events/index.ts
// =====================================

import { registerEventActions } from "./actions/events.create.action"; // wszystkie akcje events

// 🔹 eksport widoków
export * from "./views/events.view";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init() {
  // rejestrujemy wszystkie akcje events
  registerEventActions();
}