// src/modules/quickadd/commands/confirm.ts

import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export default {
  name: "confirm",
  description: "Zatwierdza dane w preview i wysyła je do warstwy serwisów.",

  async execute(interaction: ChatInputCommandInteraction) {
    const sessionManager = SessionManager.getInstance();
    const session = sessionManager.getActiveSession(interaction.guildId!);

    if (!session) {
      await interaction.reply({
        content: "❌ Brak aktywnej sesji QuickAdd.",
        ephemeral: true,
      });
      return;
    }

    try {
      await session.confirmPreview();

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "✅ Dane zostały zatwierdzone i zapisane.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "✅ Dane zostały zatwierdzone i zapisane.",
          ephemeral: true,
        });
      }

    } catch (error) {
      console.error("QuickAdd confirm error:", error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Wystąpił błąd podczas zatwierdzania danych.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ Wystąpił błąd podczas zatwierdzania danych.",
          ephemeral: true,
        });
      }
    }
  },
};