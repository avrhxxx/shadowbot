import { Message } from "discord.js";
import { startQuickAddSession } from "../utils/startQuickAddSession";

export async function rradd(message: Message, args: string[]) {
  const dateArg = args[0];

  if (!dateArg || !/^\d{4}$/.test(dateArg)) {
    await message.reply("❌ Podaj datę MMDD (np. 0703).");
    return;
  }

  await startQuickAddSession({
    message,
    eventType: "RR",
    date: dateArg
  });
}