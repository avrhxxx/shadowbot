import { Message, TextChannel, ChannelType } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { sendSessionInfo } from "../utils/sendSessionInfo";

type EventType = "rr" | "dn" | "dp";

export async function startQuickAddSession(
  message: Message,
  eventType: EventType
) {
  const guild = message.guild;
  if (!guild) return;

  // 🔥 czy sesja już istnieje
  if (SessionManager.hasSession(guild.id)) {
    await message.reply("❌ Sesja już trwa.");
    return;
  }

  // 🔥 tworzymy kanał SESJI (nie quick-add!)
  const channel = await guild.channels.create({
    name: `session-${eventType}`,
    type: ChannelType.GuildText,
  });

  // 🔥 zapis sesji
  SessionManager.createSession({
    guildId: guild.id,
    channelId: channel.id,
    moderatorId: message.author.id,
    eventType,
  });

  // 🔥 onboarding embed
  await sendSessionInfo(channel as TextChannel, message.author.id);

  await message.reply(`✅ Sesja rozpoczęta: ${channel}`);
}