// src/modules/quickadd/commands/rrattend.ts
import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export default {
  name: "rrattend",
  description: "Rozpoczyna sesję QuickAdd dla Reservoir Raid (Attend participants)",

  async execute(interaction: ChatInputCommandInteraction) {
    const dateArg = interaction.options.getString("date");
    if (!dateArg) {
      await interaction.reply({
        content: "❌ Please provide the event date in DDMM format. Example: /rrattend 0703",
        ephemeral: true,
      });
      return;
    }

    const sessionManager = SessionManager.getInstance();
    if (sessionManager.hasActiveSession()) {
      await interaction.reply({
        content: "⚠️ A QuickAdd session is already active. Please wait until it finishes.",
        ephemeral: true,
      });
      return;
    }

    // TODO: Initialize Reservoir Raid Attend session
    // const session = sessionManager.startSession("reservoirRaidAttend", dateArg, interaction.user.id);

    await interaction.reply({
      content: `✅ Reservoir Raid Attend session started for date ${dateArg}. Please upload screenshots or manual list.`,
      ephemeral: true,
    });
  },
};