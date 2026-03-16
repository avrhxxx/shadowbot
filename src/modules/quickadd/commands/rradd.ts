import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession, QuickAddSessionManager } from "../session/QuickAddSession";
import { ReservoirRaidParser } from "../parsers/ReservoirRaidParser";

export default {
  name: "rradd",
  description: "Rozpoczyna sesję QuickAdd dla Reservoir Raid",
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
        content: "⚠️ QuickAdd session already active.",
        ephemeral: true,
      });
      return;
    }

    try {
      const session = new QuickAddSession(
        `${interaction.guildId}-${Date.now()}`,
        interaction.user.id,
        interaction.channelId!
      );

      // Tutaj przypiszemy parser do sesji, jeśli QuickAddSession obsługuje parsery
      (session as any).parser = new ReservoirRaidParser();
      manager.startSession(session);

      await interaction.reply({
        content: `🟢 QuickAdd session started for Reservoir Raid on ${dateArg}`,
        ephemeral: true,
      });

    } catch (error) {
      console.error("QuickAdd rradd error:", error);
      await interaction.reply({
        content: "❌ Failed to start Reservoir Raid QuickAdd session.",
        ephemeral: true,
      });
    }
  },
};