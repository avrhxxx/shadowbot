import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager, QuickAddSession } from "../session/QuickAddSession";
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
        `duelpoints-${Date.now()}`,
        interaction.user.id,
        interaction.channelId!
      );

      // Przypisujemy parser i typ sesji
      (session as any).parser = new DuelPointsParser();
      (session as any).eventType = "DuelPoints";
      (session as any).date = dateArg;

      // Rejestrujemy sesję
      manager.startSession(session);

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