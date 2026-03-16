import { Message } from "discord.js";
import { createQuickAddChannel } from "../session/createQuickAddChannel";
import { SessionManager } from "../session/SessionManager";

export async function dnaddCommand(message: Message, args: string[]) {
  const guild = message.guild;
  if (!guild) return;

  const channel = await createQuickAddChannel(guild);

  SessionManager.setChannel(channel);

  await channel.send("Donations session started.");
}