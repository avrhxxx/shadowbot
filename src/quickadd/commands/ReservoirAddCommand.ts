import { Message } from "discord.js";
import { startQuickAddSession } from "../utils/startQuickAddSession";

export async function rradd(message: Message) {
  await startQuickAddSession(message, "rr");
}