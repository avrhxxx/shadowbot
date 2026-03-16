import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession, QuickAddSessionManager } from "../session/QuickAddSession";

export default {
  name: "rrattend",
  description: "Rozpoczyna sesję QuickAdd dla Reservoir Raid (Attend participants)",
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
        content: "⚠️ A QuickAdd session is already active. Please wait until it finishes.",
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

      // Jeśli planujesz parser do Attend, możesz go tu przypisać np.:
      // (session as any).parser = new ReservoirRaidAttendParser();

      manager.startSession(session);

      await interaction.reply({
        content: `✅ Reservoir Raid Attend session started for date ${dateArg}. Please upload screenshots or manual list.`,
        ephemeral: true,
      });

    } catch (error) {
      console.error("QuickAdd rrattend error:", error);
      await interaction.reply({
        content: "❌ Failed to start Reservoir Raid Attend QuickAdd session.",
        ephemeral: true,
      });
    }
  },
};