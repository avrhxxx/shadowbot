// src/modules/quickadd/commands/rradd.ts
import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { ReservoirRaidParser } from "../parsers/ReservoirRaidParser";

export default {
  name: "rradd",
  description: "Rozpoczyna sesję QuickAdd dla Reservoir Raid",

  async execute(interaction: ChatInputCommandInteraction) {
    const dateArg = interaction.options.getString("date");
    if (!dateArg) {
      await interaction.reply({ 
        content: "❌ Please provide a date (e.g., 0703).", 
        ephemeral: true 
      });
      return;
    }

    const sessionManager = SessionManager.getInstance();
    if (sessionManager.hasActiveSession()) {
      await interaction.reply({
        content: "⚠️ QuickAdd session already active.",
        ephemeral: true,
      });
      return;
    }

    const session = sessionManager.createSession({
      guildId: interaction.guildId!,
      moderatorId: interaction.user.id,
      eventType: "ReservoirRaid",
      date: dateArg,
      parser: new ReservoirRaidParser(),
    });

    await session.initChannel();

    await interaction.reply({
      content: `🟢 QuickAdd session started for Reservoir Raid on ${dateArg}`,
      ephemeral: true,
    });
  },
};