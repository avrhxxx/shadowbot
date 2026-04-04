// =====================================
// 📁 src/systems/events/index.ts
// =====================================

import { registerEventMainActions } from "./main/event.main.actions";

export async function init() {
  registerEventMainActions();
}