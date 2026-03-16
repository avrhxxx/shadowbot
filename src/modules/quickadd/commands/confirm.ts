import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager } from "../session/QuickAddSession";

export default {
  name: "confirm",
  description: "Zatwierdza dane w preview i wysyła je do warstwy serwisów.",

  async execute(interaction: ChatInputCommandInteraction) {
    const manager = QuickAddSessionManager.getInstance();
    const session = manager.getActiveSession();

    if (!session) {
      await interaction.reply({
        content: "❌ Brak aktywnej sesji QuickAdd.",
        ephemeral: true,
      });
      return;
    }

    try {
      await session.confirm(); // teraz używamy nowej metody confirm()

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

      // Opcjonalnie zakończ sesję po zatwierdzeniu
      manager.endSession();

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