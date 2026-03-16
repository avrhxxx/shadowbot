import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSessionManager } from "../session/QuickAddSession";

export default {
  name: "repair",
  description: "Pozwala naprawić błędy wykryte przez bota w preview sesji QuickAdd",

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

    const errorNumberStr = interaction.options.getString("errorNumber");
    const correction = interaction.options.getString("correction");

    if (!errorNumberStr || !correction) {
      await interaction.reply({
        content: "❌ Użycie: /repair <numer_błędu> <poprawka>",
        ephemeral: true,
      });
      return;
    }

    const errorNumber = parseInt(errorNumberStr, 10);
    if (isNaN(errorNumber) || errorNumber < 1) {
      await interaction.reply({
        content: "❌ Niepoprawny numer błędu.",
        ephemeral: true,
      });
      return;
    }

    // Naprawa błędu w previewBuffer
    const result = session.repairError(errorNumber - 1, correction);

    if (result) {
      await interaction.reply({
        content: `✅ Błąd [${errorNumber}] został naprawiony: ${correction}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ Nie udało się naprawić błędu [${errorNumber}].`,
        ephemeral: true,
      });
    }
  },
};