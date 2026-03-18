import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function confirm(message: Message) {
  const session = SessionManager.getSession(message.guildId!);
  if (!session) return;

  await message.reply("✅ Zapisano!");

  // 🔥 usuń kanał po chwili
  setTimeout(async () => {
    try {
      const channel = await message.guild?.channels.fetch(session.channelId);
      await channel?.delete();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, 3000);

  // 🔥 wyczyść sesję
  SessionManager.clearSession(message.guildId!);
}