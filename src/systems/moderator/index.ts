// =====================================
// 📁 src/systems/moderator/index.ts
// =====================================

import { registerModeratorActions } from "./actions/moderator.actions";
import { registerModeratorViews } from "./views/moderator.views";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init(ctx: any) {
  // Rejestrujemy akcje przycisków
  registerModeratorActions();

  // Rejestrujemy widoki (hub, event panel itd.)
  registerModeratorViews();
}