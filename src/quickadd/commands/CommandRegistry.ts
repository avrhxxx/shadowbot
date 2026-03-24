// =====================================
// 📁 src/quickadd/commands/CommandRegistry.ts
// =====================================

import {
  previewCommand,
  startCommand,
  endCommand,
  adjustCommand,
  confirmCommand,
  cancelCommand,
  fixCommand, // ✅ NEW
} from "./commands";

import { ChatInputCommandInteraction } from "discord.js";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("COMMAND");

// 🔥 STRONG TYPING
type CommandHandler = (
  interaction: ChatInputCommandInteraction
) => Promise<any>;

export const CommandRegistry: Record<string, CommandHandler> = {
  start: startCommand,
  end: endCommand,
  preview: previewCommand,
  adjust: adjustCommand,
  fix: fixCommand, // ✅ NEW
  confirm: confirmCommand,
  cancel: cancelCommand,
};

log("registry_init", Object.keys(CommandRegistry));