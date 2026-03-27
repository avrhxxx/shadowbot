// =====================================
// 📁 src/quickadd/discord/CommandBuilder.ts
// =====================================

import { SlashCommandBuilder } from "discord.js";

export function buildQuickAddCommand() {
  return new SlashCommandBuilder()
    .setName("q")
    .setDescription("QuickAdd system")

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

    .addSubcommand((sub) =>
      sub.setName("preview").setDescription("Show parsed data preview")
    )

    .addSubcommand((sub) =>
      sub
        .setName("adjust")
        .setDescription("Adjust entry manually")
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
      sub.setName("fix").setDescription("Auto-fix entries")
    )

    // =====================================
    // 🔥 CONFIRM (FIXED)
    // =====================================
    .addSubcommand((sub) =>
      sub
        .setName("confirm")
        .setDescription("Confirm and save entries")

        // ❗ NOT REQUIRED → allows Stage 1
        .addStringOption((opt) =>
          opt
            .setName("target")
            .setDescription("Select week or event")
            .setRequired(false)
            .setAutocomplete(true)
        )
    )

    .addSubcommand((sub) =>
      sub.setName("cancel").setDescription("Cancel confirmation stage")
    )

    .addSubcommand((sub) =>
      sub.setName("end").setDescription("End QuickAdd session")
    );
}