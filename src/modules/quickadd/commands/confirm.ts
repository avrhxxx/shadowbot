import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export default {
  name: "confirm",
  description: "Zatwierdza dane w preview i wysyła je do warstwy serwisów.",
  async execute(interaction: ChatInputCommandInteraction) {
    const session = SessionManager.getActiveSession(interaction.guildId!);
    if (!session) {
      await interaction.reply({ content: "❌ Brak aktywnej sesji QuickAdd.", ephemeral: true });
      return;
    }

    try {
      await session.confirmPreview();
      await interaction.reply({ content: "✅ Dane zostały zatwierdzone i zapisane.", ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "❌ Wystąpił błąd podczas zatwierdzania danych.", ephemeral: true });
    }
  },
};