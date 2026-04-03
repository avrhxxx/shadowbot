// =====================================
// 📁 src/systems/events/index.ts
// =====================================

import { init as initMain } from "./main/events.main.index";
import { init as initCommands } from "./commands";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init() {
  initMain();
  initCommands();
}