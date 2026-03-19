// src/quickadd/session/startQuickAddSession.ts

import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { sendSessionInfo } from "./sendSessionInfo";

type SessionMode = "add" | "attend";

export async function startQuickAddSession(
  message: Message,
  mode: SessionMode = "add"
) {
  const guild = message.guild;
  if (!guild) return;

  // 🔒 tylko quick-add
  const isQuickAddChannel =
    message.channel.isTextBased() &&
    "name" in message.channel &&
    message.channel.name === "quick-add";

  if (!isQuickAddChannel) {
    await message.reply("❌ Użyj tej komendy w #quick-add.");
    return;
  }

  // 🔒 jedna sesja na guild
  if (SessionManager.hasSession(guild.id)) {
    await message.reply("❌ Masz już aktywną sesję.");
    return;
  }

  const channelName = `qa-${message.author.username}`;

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

  // 🔥 NOWE — parserType = null (autodetect później)
  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    mode,
    parserType: null, // 🔥 KLUCZ
  });

  await message.reply(`✅ Sesja utworzona: ${channel}`);

  await sendSessionInfo(channel as TextChannel, message.author.id, mode);
}