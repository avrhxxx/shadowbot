import { Message } from "discord.js";
import { SessionManager } from "../../session/SessionManager";
import { QuickAddSession } from "../../session/QuickAddSession";
import { QuickAddService } from "../../services/QuickAddService";

/**
 * Komenda sesyjna !confirm
 * Waliduje dane i wysyła do service layer
 */
export async function confirmCommand(message: Message) {
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

  const quickAddService = new QuickAddService(message.client);
  await quickAddService.processSessionEntries(session);
  session.clearPreviewBuffer();

  await message.reply("✅ Dane zostały zapisane i sesja zakończona.");
  SessionManager.clear();
}