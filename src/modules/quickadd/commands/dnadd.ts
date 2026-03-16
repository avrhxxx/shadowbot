// src/modules/quickadd/commands/dnadd.ts

import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { DonationsParser } from "../parsers/DonationsParser";

export default {
  name: "dnadd",
  description: "Start a QuickAdd session for Donations",
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
        eventType: "Donations",
        date: dateArg,
        parser: new DonationsParser(),
      });

      await session.initChannel();

      await interaction.reply({
        content: `🟢 QuickAdd session started for Donations on ${dateArg}`,
        ephemeral: true,
      });

    } catch (error) {
      console.error("QuickAdd dnadd error:", error);

      await interaction.reply({
        content: "❌ Failed to start Donations QuickAdd session.",
        ephemeral: true,
      });
    }
  },
};