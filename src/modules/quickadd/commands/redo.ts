// src/modules/quickadd/commands/redo.ts
import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export default {
  name: "redo",
  description: "Wycofuje całe preview i restartuje sesję QuickAdd.",

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

    // Czyścimy preview w sesji
    session.clearPreview();

    await interaction.reply({
      content: "🔄 Preview zostało wyczyszczone. Możesz rozpocząć ponownie.",
      ephemeral: true,
    });
  },
};