// src/modules/quickadd/commands/session/RedoCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";

export async function redoCommand(message: Message) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Brak aktywnej sesji w tym kanale.");
    return;
  }

  // TODO: wyczyścić preview buffer, pozwolić moderatorowi ponownie dodać wpisy
  await message.reply("Redo command placeholder: sesja została wyczyszczona, możesz dodać nowe wpisy.");
}