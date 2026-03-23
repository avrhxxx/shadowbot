// =====================================
// 📁 src/quickadd/commands/index.ts
// =====================================

import { Interaction } from "discord.js";
import {
  qaCommand,
  quickAddCommand,
} from "./qa/qa.command";
import { handleQaCommand } from "./qa/qa.handler";

// =============================
// 📦 COMMANDS LIST
// =============================
export const quickAddCommands = [
  qaCommand,
  quickAddCommand,
];

// =============================
// 🎯 INTERACTION ROUTER
// =============================
export async function handleQuickAddInteraction(
  interaction: Interaction
) {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case "qa":
    case "quickadd":
      return handleQaCommand(interaction);
  }
}