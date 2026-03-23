// =====================================
// 📁 src/quickadd/commands/CommandRegistry.ts
// =====================================

import {
  previewCommand,
  startCommand,
  endCommand,
  adjustCommand,
} from "./commands";
import { createLogger } from "../debug/DebugLogger"; // 🔥 NEW

const log = createLogger("COMMAND"); // 🔥 NEW

export const CommandRegistry: Record<string, Function> = {
  start: startCommand,
  end: endCommand,
  preview: previewCommand,
  adjust: adjustCommand,
};

// 🔥 DEBUG – sprawdzenie rejestru przy starcie
log("registry_init", Object.keys(CommandRegistry));