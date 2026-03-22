// src/quickadd/commands/StartCommand.ts
import { Message } from "discord.js";
import { startQuickAddSession } from "../utils/startQuickAddSession";

export async function start(message: Message) {
  await startQuickAddSession(message);
}