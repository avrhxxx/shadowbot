// =====================================
// 📁 src/quickadd/commands/qa/qa.command.ts
// =====================================

import { SlashCommandBuilder } from "discord.js";

// =============================
// 🧠 COMMON SUBCOMMANDS
// =============================
function applySubcommands(builder: SlashCommandBuilder) {
  return builder
    .addSubcommand((sub) =>
      sub.setName("start").setDescription("Start session")
    )
    .addSubcommand((sub) =>
      sub.setName("end").setDescription("End session")
    )
    .addSubcommand((sub) =>
      sub.setName("preview").setDescription("Preview parsed data")
    );
}

// =============================
// 🔥 FACTORY
// =============================
function createCommand(name: string, description: string) {
  return applySubcommands(
    new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
  );
}

// =============================
// 📦 EXPORTY
// =============================
export const qaCommand = createCommand(
  "qa",
  "QuickAdd shortcut command"
);

export const quickAddCommand = createCommand(
  "quickadd",
  "QuickAdd OCR system"
);