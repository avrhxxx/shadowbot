// src/quickadd/session/startQuickAddSession.ts

import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import {
  SessionManager,
  SessionMode, // 🔥 bierzemy typ stąd (WAŻNE)
} from "../session/SessionManager";
import { sendSessionInfo } from "./sendSessionInfo";

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

  // 🔥 AUTODETECT SESSION
  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,

    eventType: "rr", // 🔥 placeholder (żeby nie rozwalić typów)
    mode,
    parserType: null, // 🔥 autodetect

    // entries dodaje się automatycznie
  });

  await message.reply(`✅ Session created: ${channel}`);

  // 🔥 FIX: sendSessionInfo NIE zna "auto"
  const infoMode = mode === "auto" ? "add" : mode;

  await sendSessionInfo(
    channel as TextChannel,
    message.author.id,
    infoMode
  );
}