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
      sub.setName("start").setDescription("Start session")
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
    );
}

// =============================
// 🔥 EXPORTY
// =============================

export const quickAddCommand = applySubcommands(
  new SlashCommandBuilder()
    .setName("quickadd")
    .setDescription("QuickAdd OCR system")
);

export const qaCommand = applySubcommands(
  new SlashCommandBuilder()
    .setName("qa")
    .setDescription("QuickAdd shortcut command")
);