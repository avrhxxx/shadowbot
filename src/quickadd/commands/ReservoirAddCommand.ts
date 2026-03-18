import { Message, ChannelType } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function rradd(message: Message) {
  const guild = message.guild;
  if (!guild) return;

  // 🔥 sprawdź czy już jest sesja
  const existing = SessionManager.getSession(guild.id);
  if (existing) {
    await message.reply("❌ Masz już aktywną sesję.");
    return;
  }

  // 🔥 twórz kanał sesji
  const channel = await guild.channels.create({
    name: `rr-session-${message.author.username}`,
    type: ChannelType.GuildText,
  });

  // 🔥 zapisz sesję
  SessionManager.createSession(guild.id, channel.id);

  // 🔥 info
  await message.reply(`✅ Utworzono sesję: ${channel}`);

  await channel.send(
    "📥 Wpisuj dane w formacie:\n`nick 100k`\n\n!preview aby zobaczyć"
  );
}