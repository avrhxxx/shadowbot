import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { sendSessionInfo } from "./sendSessionInfo";

type EventType = "rr" | "dn" | "dp";
type SessionMode = "add" | "attend";

export async function startQuickAddSession(
  message: Message,
  eventType: EventType,
  mode: SessionMode = "add"
) {
  const guild = message.guild;
  if (!guild) return;

  if (SessionManager.hasSession(guild.id)) {
    await message.reply("❌ Masz już aktywną sesję.");
    return;
  }

  const channelName = `${eventType}-${mode}-${message.author.username}`;

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

  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    eventType,
    mode,
  });

  await message.reply(`✅ Sesja utworzona: ${channel}`);

  await sendSessionInfo(channel as TextChannel, message.author.id, mode);
}