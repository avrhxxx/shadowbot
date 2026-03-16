import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager } from "../session/QuickAddSession";

export default {
  name: "adjust",
  description: "Poprawia jedną linijkę w preview sesji QuickAdd",
  options: [
    {
      name: "line",
      description: "Numer linii w preview",
      type: 4, // INTEGER
      required: true,
    },
    {
      name: "value",
      description: "Nowa wartość",
      type: 3, // STRING
      required: true,
    },
  ],

  async execute(interaction: ChatInputCommandInteraction) {
    const session = QuickAddSessionManager.getInstance().getActiveSession();
    if (!session) {
      await interaction.reply({
        content: "❌ Nie ma aktywnej sesji QuickAdd na tym serwerze.",
        ephemeral: true,
      });
      return;
    }

    const lineNumber = interaction.options.getInteger("line", true);
    const newValue = interaction.options.getString("value", true);

    // Operujemy na previewBuffer
    const entries = session.getEntries();
    if (lineNumber < 1 || lineNumber > entries.length) {
      await interaction.reply({
        content: `❌ Linia [${lineNumber}] nie istnieje w preview.`,
        ephemeral: true,
      });
      return;
    }

    entries[lineNumber - 1].value = newValue;

    await interaction.reply({
      content: `✅ Linia [${lineNumber}] została zaktualizowana na: ${newValue}`,
      ephemeral: true,
    });
  },
};