// =====================================
// 📁 src/systems/events/index.ts
// =====================================

// 🔹 rejestrujemy wszystkie akcje (side-effect)
import "./actions/events.create.action";

// 🔹 eksport widoków
export * from "./views/events.view";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init() {
  // nic nie trzeba robić — akcje rejestrują się same przez import
}