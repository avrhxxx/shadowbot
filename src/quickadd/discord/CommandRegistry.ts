// =====================================
// 📁 src/quickadd/discord/CommandRegistry.ts
// =====================================

/**
 * 📚 ROLE:
 * Maps subcommands to handlers
 *
 * ❗ RULES:
 * - NO logic
 * - ONLY mapping
 *
 * ✅ FINAL:
 * - strongly typed
 * - safe contract (no undefined)
 */

import { ChatInputCommandInteraction } from "discord.js";

// =====================================
// 🧱 TYPES
// =====================================

export type CommandHandler = (
  interaction: ChatInputCommandInteraction,
  traceId: string
) => Promise<void>;

export type QuickAddSubcommand =
  | "start"
  | "preview"
  | "adjust"
  | "fix"
  | "confirm"
  | "cancel"
  | "end";

// =====================================
// 📦 IMPORT HANDLERS (RELATIVE → NODE SAFE)
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

const registry: Record<QuickAddSubcommand, CommandHandler> = {
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
  subcommand: QuickAddSubcommand
): CommandHandler {
  return registry[subcommand];
}