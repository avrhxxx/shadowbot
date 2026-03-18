import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

export async function cancel(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  // 🧹 usuń dane sesji
  SessionData.clearEntries(guildId);

  // 🧠 usuń sesję z managera
  SessionManager.endSession(guildId);

  await message.reply("❌ Sesja została anulowana.");

  // 🗑️ usuń kanał sesji (opcjonalne, ale polecam)
  try {
    const channel = message.guild?.channels.cache.get(session.channelId);
    if (channel && channel.isTextBased()) {
      await channel.delete();
    }
  } catch (err) {
    console.error("Error deleting session channel:", err);
  }
}