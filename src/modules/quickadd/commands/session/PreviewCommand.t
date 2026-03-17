// src/modules/quickadd/commands/session/PreviewCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";

export async function previewCommand(message: Message) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Brak aktywnej sesji w tym kanale.");
    return;
  }

  // TODO: podłączyć PreviewBuffer
  await message.reply("Preview buffer (placeholder)");
}