import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { QuickAddService } from "../services/QuickAddService";

export async function confirm(message: Message) {
  const guildId = message.guildId!;
  const sessionManager = SessionManager.getInstance();
  const session = sessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji QuickAdd.");
    return;
  }

  // ❗ zabezpieczenie kanału
  if (message.channel.id !== session.channelId) {
    return;
  }

  const entries = session.previewBuffer.getAllEntries();

  if (!entries.length) {
    await message.reply("❌ Brak danych do zatwierdzenia.");
    return;
  }

  const hasErrors = entries.some(e =>
    e.flags?.some(f =>
      ["DUPLICATE", "UNREADABLE", "INVALID"].includes(f)
    )
  );

  if (hasErrors) {
    await message.reply("❌ Nie można zatwierdzić. W danych są błędy.");
    return;
  }

  // 🔥 serwis na bazie sesji
  const quickAddService = new QuickAddService(session.previewBuffer);

  await quickAddService.confirm(session);

  sessionManager.endSession(guildId);

  await message.reply("✅ Dane zostały zapisane pomyślnie.");
}