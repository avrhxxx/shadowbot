// src/modules/quickadd/commands/session/RepairCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";

export async function repairCommand(message: Message) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Brak aktywnej sesji w tym kanale.");
    return;
  }

  // TODO: naprawa formatu wpisów w PreviewBuffer
  await message.reply("Repair command placeholder");
}