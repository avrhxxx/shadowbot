// =====================================
// 📁 src/systems/devpanel/index.ts
// =====================================

import { registerDevpanelActions } from "./actions/devpanel.toggle.action";

// =====================================
// 🚀 INIT
// =====================================

export async function init() {
  registerDevpanelActions();
}