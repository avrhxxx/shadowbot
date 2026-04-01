// =====================================
// 📁 src/systems/moderator/index.ts
// =====================================

import { registerModeratorActions } from "./actions/moderator.actions";
import { registerModeratorHubActions } from "./actions/moderatorHub.actions";
import { registerModeratorViews } from "./views/moderator.views";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init(ctx: any) {
  // Rejestrujemy ogólne akcje moderatora
  registerModeratorActions();

  // Rejestrujemy akcje przycisków Hub (placeholdery)
  registerModeratorHubActions();

  // Rejestrujemy widoki (hub, event panel itd.)
  registerModeratorViews();
}