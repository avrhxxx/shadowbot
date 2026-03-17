// src/modules/quickadd/commands/session/ConfirmCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";

export async function confirmCommand(message: Message) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Brak aktywnej sesji w tym kanale.");
    return;
  }

  // TODO: podłączyć walidację i zapis danych przez QuickAddService
  await message.reply("Confirm command placeholder: dane zostały zatwierdzone.");
}