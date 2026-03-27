// =====================================
// 📁 src/quickadd/discord/CommandBuilder.ts
// =====================================

import { SlashCommandBuilder } from "discord.js";

/**
 * 🧠 ROLE:
 * Builds /q slash command structure
 *
 * ❗ RULES:
 * - NO business logic
 * - ONLY command schema
 * - must align with handlers
 *
 * ✅ FINAL:
 * - stage-based confirm (target optional)
 * - consistent descriptions
 */

export function buildQuickAddCommand() {
  return new SlashCommandBuilder()
    .setName("q")
    .setDescription("QuickAdd system commands")

    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a new QuickAdd session")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("QuickAdd mode")
            .setRequired(true)
            .addChoices(
              { name: "Donations", value: "DONATIONS_POINTS" },
              { name: "Duel", value: "DUEL_POINTS" },
              { name: "RR Signups", value: "RR_SIGNUPS" },
              { name: "RR Results", value: "RR_RESULTS" }
            )
        )
    )

    .addSubcommand((sub) =>
      sub.setName("preview").setDescription("Show current parsed entries")
    )

    .addSubcommand((sub) =>
      sub
        .setName("adjust")
        .setDescription("Manually adjust entry")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Entry ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("nickname").setDescription("New nickname")
        )
        .addIntegerOption((opt) =>
          opt.setName("value").setDescription("New value")
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("fix")
        .setDescription("Auto-fix entries using suggestions")
    )

    .addSubcommand((sub) =>
      sub
        .setName("confirm")
        .setDescription("Confirm entries (2-stage process)")
        .addStringOption((opt) =>
          opt
            .setName("target")
            .setDescription("Target (week/event)")
            .setRequired(false)
            .setAutocomplete(true)
        )
    )

    .addSubcommand((sub) =>
      sub.setName("cancel").setDescription("Clear buffer (keep session)")
    )

    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End QuickAdd session completely")
    );
}

// 🔥 FIX: to jest brakujący export wymagany przez index.ts
export const qCommand = buildQuickAddCommand();