import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { sendSessionInfo } from "../utils/sendSessionInfo";

type EventType = "rr" | "dn" | "dp";

export async function startQuickAddSession(
  message: Message,
  eventType: EventType
) {
  const guild = message.guild;
  if (!guild) return;

  // 🔒 blokada
  if (SessionManager.hasSession(guild.id)) {
    await message.reply("❌ Masz już aktywną sesję.");
    return;
  }

  // 🧠 nazwa kanału
  const channelName = `${eventType}-session-${message.author.username}`;

  // 🔥 tworzenie kanału
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: message.author.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
        ],
      },
    ],
  });

  // 💾 zapis sesji
  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    eventType,
  });

  await message.reply(`✅ Sesja utworzona: ${channel}`);

  // 📘 onboarding
  await sendSessionInfo(channel as TextChannel, message.author.id);
}