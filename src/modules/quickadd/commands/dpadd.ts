// src/modules/quickadd/commands/dpadd.ts

import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { DuelPointsParser } from "../parsers/DuelPointsParser";

export default {
  name: "dpadd",
  description: "Start a QuickAdd session for Duel Points",
  options: [
    {
      name: "date",
      description: "Event date in DDMM format (example: 0703)",
      type: 3, // STRING
      required: true,
    },
  ],

  async execute(interaction: ChatInputCommandInteraction) {
    const dateArg = interaction.options.getString("date", true);

    const sessionManager = SessionManager.getInstance();

    if (sessionManager.hasActiveSession()) {
      await interaction.reply({
        content: "⚠️ A QuickAdd session is already active.",
        ephemeral: true,
      });
      return;
    }

    try {
      const session = sessionManager.createSession({
        guildId: interaction.guildId!,
        moderatorId: interaction.user.id,
        eventType: "DuelPoints",
        date: dateArg,
        parser: new DuelPointsParser(),
      });

      await session.initChannel();

      await interaction.reply({
        content: `🟢 QuickAdd session started for Duel Points on ${dateArg}`,
        ephemeral: true,
      });

    } catch (error) {
      console.error("QuickAdd dpadd error:", error);

      await interaction.reply({
        content: "❌ Failed to start Duel Points QuickAdd session.",
        ephemeral: true,
      });
    }
  },
};