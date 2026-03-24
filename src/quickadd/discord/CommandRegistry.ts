// =====================================
// 📁 src/quickadd/discord/CommandRegistry.ts
// =====================================

/**
 * 📚 ROLE:
 * Maps subcommands to their handlers.
 *
 * Responsible for:
 * - registering all command actions
 * - providing handler lookup
 *
 * ❗ RULES:
 * - NO business logic
 * - NO Discord logic
 * - only mapping layer
 */

import { ChatInputCommandInteraction } from "discord.js";

// =====================================
// 🧱 TYPE
// =====================================

export type CommandHandler = (
  interaction: ChatInputCommandInteraction
) => Promise<void>;

// =====================================
// 📦 IMPORT HANDLERS
// =====================================

import { handleStart } from "./actions/start/start";
import { handlePreview } from "./actions/preview/preview";
import { handleAdjust } from "./actions/adjust/adjust";
import { handleFix } from "./actions/fix/fix";
import { handleConfirm } from "./actions/confirm/confirm";
import { handleCancel } from "./actions/cancel/cancel";
import { handleEnd } from "./actions/end/end";

// =====================================
// 🧠 REGISTRY
// =====================================

const registry: Record<string, CommandHandler> = {
  start: handleStart,
  preview: handlePreview,
  adjust: handleAdjust,
  fix: handleFix,
  confirm: handleConfirm,
  cancel: handleCancel,
  end: handleEnd,
};

// =====================================
// 🚀 PUBLIC API
// =====================================

export function getCommandHandler(
  subcommand: string
): CommandHandler | null {
  return registry[subcommand] || null;
}