import { Message } from "discord.js";
import { startQuickAddSession } from "../utils/startQuickAddSession";

export async function dnadd(message: Message) {
  await startQuickAddSession(message, "dn", "add");
}