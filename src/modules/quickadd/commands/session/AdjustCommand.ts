// src/modules/quickadd/commands/session/AdjustCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";

export async function adjustCommand(message: Message, args: string[]) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Brak aktywnej sesji w tym kanale.");
    return;
  }

  // TODO: obsłużyć korektę wpisów w PreviewBuffer
  await message.reply(`Adjust command placeholder: ${args.join(" ")}`);
}