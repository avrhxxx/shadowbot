import { Message } from "discord.js";
import { startQuickAddSession } from "../utils/startQuickAddSession";

export async function rrattend(message: Message) {
  await startQuickAddSession(message, "rr", "attend");
}