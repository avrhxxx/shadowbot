import { Command } from "../../types/Command";
import { QuickAddSessionManager } from "../session/SessionManager";

export const RepairCommand: Command = {
  name: "repair",
  description: "Pozwala naprawić błędy wykryte przez bota w preview sesji QuickAdd",
  execute: async (message, args) => {
    const session = QuickAddSessionManager.getActiveSession(message.guildId);
    if (!session) {
      message.reply("❌ Nie ma aktywnej sesji QuickAdd na tym serwerze.");
      return;
    }

    if (args.length < 2) {
      message.reply("❌ Użycie: !repair <numer_błędu> <poprawka>");
      return;
    }

    const errorNumber = parseInt(args[0], 10);
    if (isNaN(errorNumber) || errorNumber < 1) {
      message.reply("❌ Niepoprawny numer błędu.");
      return;
    }

    const correctedLine = args.slice(1).join(" ");
    const result = session.repairError(errorNumber - 1, correctedLine);

    if (result) {
      message.reply(`✅ Błąd [${errorNumber}] został naprawiony: ${correctedLine}`);
    } else {
      message.reply(`❌ Nie udało się naprawić błędu [${errorNumber}].`);
    }
  },
};