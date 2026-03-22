// src/quickadd/utils/startQuickAddSession.ts

import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

// ✅ FIX: SessionStore + SessionMode
import {
  SessionStore,
  SessionMode,
} from "../session/sessionStore";

import { sendSessionInfo } from "./sendSessionInfo";

export async function startQuickAddSession(
  message: Message,
  mode: SessionMode = "auto"
) {
  const guild = message.guild;
  if (!guild) return;

  console.log("🚀 START SESSION REQUEST");

  // 🔒 tylko #quick-add
  const isQuickAddChannel =
    message.channel.isTextBased() &&
    "name" in message.channel &&
    message.channel.name === "quick-add";

  if (!isQuickAddChannel) {
    console.log("❌ Wrong channel");
    await message.reply("❌ Use this command in #quick-add.");
    return;
  }

  // 🔒 jedna sesja na guild
  if (SessionStore.hasSession(guild.id)) {
    console.log("❌ Session already exists");
    await message.reply("❌ You already have an active session.");
    return;
  }

  const channelName = `session-${message.author.username.toLowerCase()}`;

  console.log("📦 Creating session channel:", channelName);

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

  // =====================================
  // 🧠 CREATE SESSION
  // =====================================
  SessionStore.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    mode,
    parserType: null,
  });

  console.log("✅ Session created:", channel.id);

  await message.reply(`✅ Session created: ${channel}`);

  const infoMode = mode === "auto" ? "add" : mode;

  await sendSessionInfo(
    channel as TextChannel,
    message.author.id,
    infoMode
  );

  // =====================================
  // 🔥 SAFE SEND (fallback)
  // =====================================
  const safeSend = async (msg: string) => {
    try {
      await channel.send(msg);
    } catch {
      console.warn("⚠️ Channel no longer exists (skip send)");
    }
  };

  // =====================================
  // ⏱️ TIMEOUT INFO (tylko log)
  // =====================================
  console.log("⏱️ Session timeout handled by SessionStore");

  // (timeout już jest w SessionStore.resetTimeout)
}