// =====================================
// 📁 src/system/quickadd/discord/CommandRegistry.ts
// =====================================

/**
 * 📚 ROLE:
 * Maps subcommands to handlers
 *
 * ❗ RULES:
 * - NO business logic
 * - ONLY mapping
 * - FULL observability
 *
 * ✅ FINAL:
 * - strongly typed
 * - safe contract (no undefined)
 */

import { ChatInputCommandInteraction } from "discord.js";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

// =====================================
// 🧱 TYPES
// =====================================

export type CommandHandler = (
  interaction: ChatInputCommandInteraction,
  ctx: TraceContext
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
  subcommand: string,
  ctx: TraceContext
): CommandHandler | null {
  const l = log.ctx(ctx);

  const handler = registry[subcommand as QuickAddSubcommand];

  if (!handler) {
    l.warn("handler_not_found", {
      subcommand,
    });

    return null;
  }

  l.event("handler_resolved", {
    subcommand,
  });

  return handler;
}