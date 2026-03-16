import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager, QuickAddSession } from "../session/QuickAddSession";
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

    const manager = QuickAddSessionManager.getInstance();

    if (manager.hasActiveSession()) {
      await interaction.reply({
        content: "⚠️ A QuickAdd session is already active.",
        ephemeral: true,
      });
      return;
    }

    try {
      // Tworzymy nową sesję
      const session = new QuickAddSession(
        `donations-${Date.now()}`,
        interaction.user.id,
        interaction.channelId!
      );

      // Tutaj możesz przypisać parser do sesji, jeśli sesja go potrzebuje
      (session as any).parser = new DonationsParser();
      (session as any).eventType = "Donations";
      (session as any).date = dateArg;

      // Rejestrujemy sesję w menedżerze
      manager.startSession(session);

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