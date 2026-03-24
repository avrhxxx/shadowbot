// =====================================
// 📁 src/quickadd/discord/CommandBuilder.ts
// =====================================

/**
 * 🏗️ ROLE:
 * Defines slash command structure for QuickAdd.
 *
 * Responsible for:
 * - building /q command schema
 * - defining subcommands
 * - defining options
 *
 * ❗ RULES:
 * - NO logic
 * - only structure
 */

import { SlashCommandBuilder } from "discord.js";

export function buildQuickAddCommand() {
  return new SlashCommandBuilder()
    .setName("q")
    .setDescription("QuickAdd system")

    // =============================
    // ▶️ START
    // =============================
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start QuickAdd session")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Type of QuickAdd")
            .setRequired(true)
            .addChoices(
              { name: "Donations", value: "DONATIONS_POINTS" },
              { name: "Duel", value: "DUEL_POINTS" },
              { name: "RR Signups", value: "RR_SIGNUPS" },
              { name: "RR Results", value: "RR_RESULTS" }
            )
        )
    )

    // =============================
    // 👀 PREVIEW
    // =============================
    .addSubcommand((sub) =>
      sub
        .setName("preview")
        .setDescription("Show parsed data preview")
    )

    // =============================
    // ✏️ ADJUST
    // =============================
    .addSubcommand((sub) =>
      sub
        .setName("adjust")
        .setDescription("Adjust entry manually")
        .addIntegerOption((opt) =>
          opt
            .setName("id")
            .setDescription("Entry ID")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("nickname")
            .setDescription("New nickname")
        )
        .addIntegerOption((opt) =>
          opt
            .setName("value")
            .setDescription("New value")
        )
    )

    // =============================
    // 🤖 FIX
    // =============================
    .addSubcommand((sub) =>
      sub
        .setName("fix")
        .setDescription("Auto-fix entries")
    )

    // =============================
    // ✅ CONFIRM
    // =============================
    .addSubcommand((sub) =>
      sub
        .setName("confirm")
        .setDescription("Confirm and save entries")
    )

    // =============================
    // ↩️ CANCEL
    // =============================
    .addSubcommand((sub) =>
      sub
        .setName("cancel")
        .setDescription("Cancel confirmation stage")
    )

    // =============================
    // 🛑 END
    // =============================
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End QuickAdd session")
    );
}