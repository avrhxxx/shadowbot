// =====================================
// 📁 src/quickadd/commands/CommandRegistry.ts
// =====================================

import {
  previewCommand,
  startCommand,
  endCommand,
  adjustCommand,
} from "./commands";
import { debug } from "../debug/DebugLogger"; // 🔥 NEW

const SCOPE = "COMMAND"; // 🔥 NEW

export const CommandRegistry: Record<string, Function> = {
  start: startCommand,
  end: endCommand,
  preview: previewCommand,
  adjust: adjustCommand,
};

// 🔥 DEBUG – sprawdzenie rejestru przy starcie
debug(SCOPE, "REGISTRY_INIT", Object.keys(CommandRegistry));