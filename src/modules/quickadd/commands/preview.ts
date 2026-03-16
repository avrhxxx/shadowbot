// src/modules/quickadd/commands/preview.ts

import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export default {
  name: "preview",
  description: "Wyświetla podgląd danych w bieżącej sesji QuickAdd",

  async execute(interaction: ChatInputCommandInteraction) {
    const sessionManager = SessionManager.getInstance();
    const session = sessionManager.getActiveSession(interaction.guildId!);

    if (!session) {
      await interaction.reply({
        content: "❌ Nie ma aktywnej sesji QuickAdd na tym serwerze.",
        ephemeral: true,
      });
      return;
    }

    const preview = session.getPreviewBuffer();

    if (!preview || preview.length === 0) {
      await interaction.reply({
        content: "⚠️ Preview jest puste. Dodaj najpierw dane do sesji.",
        ephemeral: true,
      });
      return;
    }

    let previewMessage = "📝 **Preview danych QuickAdd:**\n";

    preview.forEach((entry: any, index: number) => {
      previewMessage += `[${index + 1}] ${entry.nickname} – ${entry.value ?? "brak danych"}\n`;
    });

    await interaction.reply({
      content: previewMessage,
      ephemeral: true,
    });
  },
};