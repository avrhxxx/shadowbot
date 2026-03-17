import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";
import { QuickAddSession } from "../../session/QuickAddSession";

/**
 * Komenda sesyjna !cancel
 * Natychmiast zamyka sesję i usuwa kanał sesyjny
 */
export async function cancelCommand(message: Message) {
  const channel = SessionManager.getChannel();
  if (!channel || channel.id !== message.channel.id) {
    await message.reply("⚠️ Ta komenda działa tylko w aktywnej sesji QuickAdd.");
    return;
  }

  const session = QuickAddSession.getSession(channel.id);
  if (session) {
    session.clearPreviewBuffer();
  }

  await message.reply("❌ Sesja QuickAdd została anulowana.");
  SessionManager.clear();
  // TODO: usuwanie kanału sesyjnego, jeśli istnieje
}