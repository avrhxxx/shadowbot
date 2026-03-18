import {
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { SessionManager, ParserType } from "../session/SessionManager";
import { sendSessionInfo } from "./sendSessionInfo";

type EventType = "rr" | "dn" | "dp";
type SessionMode = "add" | "attend";

// 🔥 MAPOWANIE DO PARSERÓW
function resolveParserType(
  eventType: EventType,
  mode: SessionMode
): ParserType {
  if (eventType === "rr" && mode === "add") return "RR_RAID";
  if (eventType === "rr" && mode === "attend") return "RR_ATTENDANCE";
  if (eventType === "dn") return "DONATIONS";
  if (eventType === "dp") return "DUEL_POINTS";

  throw new Error("Unsupported session type");
}

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

  // 🔥 KLUCZOWE
  const parserType = resolveParserType(eventType, mode);

  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    eventType,
    mode,
    parserType, // 🔥 NOWE
  });

  await message.reply(`✅ Sesja utworzona: ${channel}`);

  await sendSessionInfo(channel as TextChannel, message.author.id, mode);
}