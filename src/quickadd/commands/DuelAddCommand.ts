import { Message } from "discord.js";
import { startQuickAddSession } from "../utils/startQuickAddSession";

export async function dpadd(message: Message) {
  await startQuickAddSession(message, "dp", "add");
}