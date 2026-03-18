import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function confirm(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) return;

  await message.reply("✅ Zapisano!");

  setTimeout(async () => {
    try {
      const channel = await message.guild?.channels.fetch(session.channelId);
      await channel?.delete();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, 3000);

  SessionManager.endSession(guildId);
}