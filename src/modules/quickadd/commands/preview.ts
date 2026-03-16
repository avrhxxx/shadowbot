import { Command } from "../../types/Command";
import { QuickAddSessionManager } from "../session/SessionManager";

export const PreviewCommand: Command = {
  name: "preview",
  description: "Wyświetla podgląd danych w bieżącej sesji QuickAdd",
  execute: async (message, args) => {
    const session = QuickAddSessionManager.getActiveSession(message.guildId);
    if (!session) {
      message.reply("❌ Nie ma aktywnej sesji QuickAdd na tym serwerze.");
      return;
    }

    const preview = session.getPreviewBuffer();
    if (preview.length === 0) {
      message.reply("⚠️ Preview jest puste. Dodaj najpierw dane do sesji.");
      return;
    }

    let previewMessage = "📝 **Preview danych QuickAdd:**\n";
    preview.forEach((entry, index) => {
      previewMessage += `[${index + 1}] ${entry.nickname} – ${entry.value || "brak danych"}\n`;
    });

    message.reply(previewMessage);
  },
};