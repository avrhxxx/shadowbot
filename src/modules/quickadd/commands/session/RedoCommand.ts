import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";
import { QuickAddSession } from "../../session/QuickAddSession";

/**
 * Komenda sesyjna !redo
 * Czyści preview buffer i restartuje sesję
 */
export async function redoCommand(message: Message) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Ta komenda działa tylko w aktywnej sesji QuickAdd.");
    return;
  }

  const session = QuickAddSession.getSession(channel.id);
  if (!session) {
    await message.reply("⚠️ Brak aktywnej sesji QuickAdd.");
    return;
  }

  session.clearPreviewBuffer();
  await message.reply("✅ Preview buffer został wyczyszczony. Możesz zacząć od nowa.");
}