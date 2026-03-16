import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager } from "../session/QuickAddSession";

export default {
  name: "preview",
  description: "Wyświetla podgląd danych w bieżącej sesji QuickAdd",

  async execute(interaction: ChatInputCommandInteraction) {
    const manager = QuickAddSessionManager.getInstance();
    const session = manager.getActiveSession();

    if (!session) {
      await interaction.reply({
        content: "❌ Nie ma aktywnej sesji QuickAdd na tym serwerze.",
        ephemeral: true,
      });
      return;
    }

    const preview = session.getEntries();

    if (!preview || preview.length === 0) {
      await interaction.reply({
        content: "⚠️ Preview jest puste. Dodaj najpierw dane do sesji.",
        ephemeral: true,
      });
      return;
    }

    let previewMessage = "📝 **Preview danych QuickAdd:**\n";

    preview.forEach((entry, index) => {
      previewMessage += `[${index + 1}] ${entry.nickname} – ${entry.value ?? "brak danych"}\n`;
    });

    await interaction.reply({
      content: previewMessage,
      ephemeral: true,
    });
  },
};