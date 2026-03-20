// src/quickadd/session/startQuickAddSession.ts

import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import {
  SessionManager,
  SessionMode,
} from "../session/SessionManager";
import { sendSessionInfo } from "./sendSessionInfo";

import { startTimeout } from "../session/TimeoutManager";
import { SessionData } from "../session/SessionData";

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

  // 🔥 CREATE SESSION
  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    mode,
    parserType: null,
  });

  await message.reply(`✅ Session created: ${channel}`);

  const infoMode = mode === "auto" ? "add" : mode;

  await sendSessionInfo(
    channel as TextChannel,
    message.author.id,
    infoMode
  );

  // =========================
  // 🔥 SAFE SEND
  // =========================
  const safeSend = async (msg: string) => {
    try {
      const fetched = await message.client.channels.fetch(channel.id);

      if (!fetched || !fetched.isTextBased()) return;

      await fetched.send(msg);
    } catch {
      console.warn("⚠️ Channel no longer exists (skip send)");
    }
  };

  // =========================
  // 🔥 TIMEOUT START
  // =========================
  startTimeout(
    guild.id,
    async () => {
      await safeSend("⚠️ Session inactive. Closing in 60 seconds.");
    },
    async () => {
      await safeSend("❌ Session closed due to inactivity.");

      SessionData.clear(guild.id);
      SessionManager.endSession(guild.id);

      try {
        const fetched = await message.client.channels.fetch(channel.id);
        if (fetched && fetched.isTextBased()) {
          await (fetched as TextChannel).delete();
        }
      } catch {
        console.warn("⚠️ Channel already deleted");
      }
    }
  );
}