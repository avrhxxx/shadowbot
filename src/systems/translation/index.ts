// =====================================
// 📁 src/systems/translation/index.ts
// =====================================

// 🔹 ACTIONS
import "./actions/translation.actions";

// 🔹 LISTENERS
import "./listeners/translation.listener";

// =====================================
// 🔹 INIT (dla runtimeLoader)
// =====================================

export async function init() {
  // nic nie robimy – samo importowanie rejestruje actions + listener
}