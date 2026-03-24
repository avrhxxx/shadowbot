// =====================================
// 📁 src/quickadd/commands/CommandBuilder.ts
// =====================================

import { SlashCommandBuilder } from "discord.js";

// =============================
// 🧠 SUBCOMMANDS
// =============================
function applySubcommands(builder: SlashCommandBuilder) {
  return builder
    // ▶️ START
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start session")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Select screenshot type")
            .setRequired(true)
            .addChoices(
              { name: "Donations Points", value: "DONATIONS_POINTS" },
              { name: "Duel Points", value: "DUEL_POINTS" },
              { name: "Reservoir Signups", value: "RR_SIGNUPS" },
              { name: "Reservoir Results", value: "RR_RESULTS" }
            )
        )
    )

    // ⛔ END
    .addSubcommand((sub) =>
      sub.setName("end").setDescription("End session")
    )

    // 👀 PREVIEW
    .addSubcommand((sub) =>
      sub.setName("preview").setDescription("Preview parsed data")
    )

    // ✏️ ADJUST
    .addSubcommand((sub) =>
      sub
        .setName("adjust")
        .setDescription("Adjust parsed entry")

        .addIntegerOption((opt) =>
          opt
            .setName("id")
            .setDescription("Line ID from preview")
            .setRequired(true)
        )

        .addStringOption((opt) =>
          opt
            .setName("field")
            .setDescription("Field to edit")
            .setRequired(true)
            .addChoices(
              { name: "Nickname", value: "nickname" },
              { name: "Value", value: "value" }
            )
        )

        .addStringOption((opt) =>
          opt
            .setName("value")
            .setDescription("New value")
            .setRequired(true)
        )
    )

    // ✅ CONFIRM (NEW)
    .addSubcommand((sub) =>
      sub
        .setName("confirm")
        .setDescription("Confirm and send data to queue")
    );
}

// =============================
// 🔥 EXPORT
// =============================

export const qCommand = applySubcommands(
  new SlashCommandBuilder()
    .setName("q")
    .setDescription("QuickAdd OCR system")
);