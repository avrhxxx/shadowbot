import { Message, ChannelType, PermissionFlagsBits } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function rradd(message: Message) {
  const guild = message.guild;
  if (!guild) return;

  // 🔥 blokada jeśli sesja istnieje
  if (SessionManager.hasSession(guild.id)) {
    await message.reply("❌ Masz już aktywną sesję.");
    return;
  }

  // 🔥 tworzenie kanału (JUŻ Z PERMISJAMI)
  const channel = await guild.channels.create({
    name: `rr-session-${message.author.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: message.author.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ],
  });

  // 🔥 zapis sesji
  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    eventType: "rr",
  });

  await message.reply(`✅ Sesja utworzona: ${channel}`);

  await channel.send(
    "📥 Wpisuj dane:\n`nick 100k`\n\n!preview żeby zobaczyć\n!confirm żeby zatwierdzić"
  );
}