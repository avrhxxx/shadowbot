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
import { logger } from "../../../core/logger/log";

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
  traceId: string
): CommandHandler | null {
  const handler = registry[subcommand as QuickAddSubcommand];

  if (!handler) {
    logger.emit({
      scope: "quickadd.registry",
      event: "handler_not_found",
      traceId,
      level: "warn",
      context: {
        subcommand,
      },
    });

    return null;
  }

  logger.emit({
    scope: "quickadd.registry",
    event: "handler_resolved",
    traceId,
    context: {
      subcommand,
    },
  });

  return handler;
}