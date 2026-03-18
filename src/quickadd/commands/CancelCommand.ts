import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

export async function cancel(message: Message) {
  if (!message.guildId) return;

  const session = SessionManager.getSession(message.guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  // 🔥 czyścimy wszystko
  SessionData.clear(message.guildId);
  SessionManager.endSession(message.guildId);

  await message.reply("🛑 Sesja została anulowana.");
}
