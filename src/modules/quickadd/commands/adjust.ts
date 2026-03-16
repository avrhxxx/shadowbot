import { Command } from "../../types/Command";
import { QuickAddSessionManager } from "../session/SessionManager";

export const AdjustCommand: Command = {
  name: "adjust",
  description: "Pozwala poprawić jedną linijkę w preview sesji QuickAdd",
  execute: async (message, args) => {
    const session = QuickAddSessionManager.getActiveSession(message.guildId);
    if (!session) {
      message.reply("❌ Nie ma aktywnej sesji QuickAdd na tym serwerze.");
      return;
    }

    if (args.length < 2) {
      message.reply("❌ Użycie: !adjust <numer_linijki> <poprawka>");
      return;
    }

    const lineNumber = parseInt(args[0], 10);
    if (isNaN(lineNumber) || lineNumber < 1) {
      message.reply("❌ Niepoprawny numer linijki.");
      return;
    }

    const newValue = args.slice(1).join(" ");
    const result = session.adjustLine(lineNumber - 1, newValue);

    if (result) {
      message.reply(`✅ Linia [${lineNumber}] została zaktualizowana na: ${newValue}`);
    } else {
      message.reply(`❌ Nie udało się zaktualizować linii [${lineNumber}].`);
    }
  },
};