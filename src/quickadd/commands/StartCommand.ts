import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function start(message: Message) {
  const guildId = message.guildId!;

  SessionManager.createSession(guildId, {
    moderatorId: message.author.id,
    channelId: message.channel.id,
    mode: "auto", // 🔥 nowy tryb
  });

  await message.reply(
    "🟢 Auto session started.\n📸 Send screenshots — bot will detect everything automatically."
  );
}