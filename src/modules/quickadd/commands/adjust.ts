// src/modules/quickadd/commands/adjust.ts

import { ChatInputCommandInteraction } from "discord.js";
import { SessionManager } from "../session/SessionManager";

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
    const session = SessionManager.getInstance().getActiveSession(interaction.guildId!);

    if (!session) {
      await interaction.reply({
        content: "❌ Nie ma aktywnej sesji QuickAdd na tym serwerze.",
        ephemeral: true,
      });
      return;
    }

    const lineNumber = interaction.options.getInteger("line", true);
    const newValue = interaction.options.getString("value", true);

    const result = session.adjustLine(lineNumber - 1, newValue);

    if (result) {
      await interaction.reply({
        content: `✅ Linia [${lineNumber}] została zaktualizowana na: ${newValue}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ Nie udało się zaktualizować linii [${lineNumber}].`,
        ephemeral: true,
      });
    }
  },
};