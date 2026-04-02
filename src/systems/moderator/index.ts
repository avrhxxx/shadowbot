// =====================================
// 📁 src/systems/moderator/index.ts
// =====================================

import { registerModeratorHubActions } from "./actions/moderator.actions";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init() {
  registerModeratorHubActions();
}