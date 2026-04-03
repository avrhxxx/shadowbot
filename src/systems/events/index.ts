// =====================================
// 📁 src/systems/events/index.ts
// =====================================

import { registerEventsMainActions } from "./actions/events.main.action";

// =====================================
// 🚀 INIT SYSTEM
// =====================================

export async function init() {
  registerEventsMainActions();

  // 🔹 przyszłe rejestracje flow
  // import { registerCreateFlow } from "./create/events.create.action";
  // registerCreateFlow();
  //
  // import { registerListFlow } from "./list/events.list.action";
  // registerListFlow();
  //
  // itd.
}