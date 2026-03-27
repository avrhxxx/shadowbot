// =====================================
// 📁 src/quickadd/discord/CommandBuilder.ts
// =====================================

/**
 * 🧠 ROLE:
 * Builds /q slash command structure
 *
 * ❗ RULES:
 * - NO business logic
 * - Discord.js compliant
 * - clear UX descriptions
 *
 * ✅ FINAL:
 * - consistent descriptions
 * - autocomplete ready
 * - TS safe
 */

import { SlashCommandBuilder } from "discord.js";

export function buildQuickAddCommand(): SlashCommandBuilder {
  return new SlashCommandBuilder()
    .setName("q")
    .setDescription("QuickAdd system")

    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a new QuickAdd session")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Select data type to collect")
            .setRequired(true)
            .addChoices(
              { name: "Donations", value: "DONATIONS_POINTS" },
              { name: "Duel Points", value: "DUEL_POINTS" },
              { name: "RR Signups", value: "RR_SIGNUPS" },
              { name: "RR Results", value: "RR_RESULTS" }
            )
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("preview")
        .setDescription("Show current parsed entries")
    )

    .addSubcommand((sub) =>
      sub
        .setName("adjust")
        .setDescription("Manually adjust entry")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Entry ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("nickname").setDescription("Correct nickname")
        )
        .addIntegerOption((opt) =>
          opt.setName("value").setDescription("Correct value")
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("fix")
        .setDescription("Apply automatic fixes (suggestions)")
    )

    .addSubcommand((sub) =>
      sub
        .setName("confirm")
        .setDescription("Confirm entries (2-step process)")
        .addStringOption((opt) =>
          opt
            .setName("target")
            .setDescription("Select week or event (step 2)")
            .setRequired(false)
            .setAutocomplete(true)
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("cancel")
        .setDescription("Clear buffer (keep session active)")
    )

    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End session and cleanup")
    );
}