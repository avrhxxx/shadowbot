import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager } from "../session/QuickAddSession";

export default {
  name: "redo",
  description: "Wycofuje całe preview i restartuje sesję QuickAdd.",

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

    // Czyścimy preview w sesji
    session.cancel(); // usuwa wszystkie wpisy i ustawia stan CANCELLED

    await interaction.reply({
      content: "🔄 Preview zostało wyczyszczone. Możesz rozpocząć ponownie.",
      ephemeral: true,
    });
  },
};