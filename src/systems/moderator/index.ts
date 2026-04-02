// =====================================
// 📁 src/systems/moderator/index.ts
// =====================================

import { registerModeratorHubActions } from "./actions/moderator.actions";
import { renderModeratorHub } from "./views/moderator.view";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init(_ctx: any) {
  // Rejestrujemy akcje przycisków Hub (moderator.open)
  registerModeratorHubActions();

  // Możemy tu później dodać więcej widoków, jeśli będą potrzebne
  // np. renderEventPanel, renderPointsPanel itd.
}