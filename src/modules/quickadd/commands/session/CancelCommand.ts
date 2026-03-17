// src/modules/quickadd/commands/session/CancelCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";

export async function cancelCommand(message: Message) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Brak aktywnej sesji w tym kanale.");
    return;
  }

  // TODO: usunąć sesję, wyczyścić preview buffer itp.
  SessionManager.clear();
  await message.reply("Cancel command placeholder: sesja została anulowana.");
}