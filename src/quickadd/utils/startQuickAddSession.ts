// src/quickadd/session/startQuickAddSession.ts

import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { sendSessionInfo } from "./sendSessionInfo";

type SessionMode = "add" | "attend" | "auto";

export async function startQuickAddSession(
  message: Message,
  mode: SessionMode = "auto"
) {
  const guild = message.guild;
  if (!guild) return;

  // 🔒 tylko quick-add
  const isQuickAddChannel =
    message.channel.isTextBased() &&
    "name" in message.channel &&
    message.channel.name === "quick-add";

  if (!isQuickAddChannel) {
    await message.reply("❌ Use this command in #quick-add.");
    return;
  }

  // 🔒 jedna sesja na guild
  if (SessionManager.hasSession(guild.id)) {
    await message.reply("❌ You already have an active session.");
    return;
  }

  const channelName = `session-${message.author.username.toLowerCase()}`;

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

  // 🔥 autodetect mode
  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    mode,
    parserType: null, // 🔥 autodetect
  });

  await message.reply(`✅ Session created: ${channel}`);

  await sendSessionInfo(channel as TextChannel, message.author.id, mode);
}