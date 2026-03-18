import {
  CommandInteraction,
  ChannelType,
  PermissionFlagsBits
} from "discord.js";
import { SessionManager } from "../session/SessionManager";

type StartOptions = {
  interaction: CommandInteraction;
  eventType: "RR" | "DN" | "DP" | "RR_ATTEND";
  date?: string;
  week?: string;
};

export async function startQuickAddSession({
  interaction,
  eventType,
  date,
  week
}: StartOptions) {
  const guild = interaction.guild!;
  const guildId = guild.id;
  const moderatorId = interaction.user.id;

  const sessionManager = SessionManager.getInstance();

  if (sessionManager.hasActiveSession(guildId)) {
    await interaction.reply({
      content: "⚠️ Na tym serwerze jest już aktywna sesja QuickAdd.",
      ephemeral: true
    });
    return;
  }

  // 🔥 kanał
  const channel = await guild.channels.create({
    name: "quick-add-session",
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: moderatorId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: guild.members.me!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ],
  });

  // 🔥 sesja
  sessionManager.createSession(
    guildId,
    moderatorId,
    {
      eventType,
      date,
      week
    },
    channel.id
  );

  await interaction.reply({
    content: `✅ Sesja utworzona: ${channel}`,
    ephemeral: true
  });

  await channel.send({
    content: `📥 **QuickAdd Session (${eventType})**\n${date ? `Data: ${date}` : `Zakres: ${week}`}`
  });
}