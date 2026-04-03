// =====================================
// 📁 src/systems/events/main/events.main.index.ts
// =====================================

import { registerEventsMainActions } from "./events.main.action";

// =====================================
// 🚀 INIT MAIN
// =====================================

export function init() {
  registerEventsMainActions();
}