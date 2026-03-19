// src/quickadd/commands/ConfirmCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";
import { buildEventSelectMenu } from "../ui/eventSelectMenu";

export async function confirm(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ No active session.");
    return;
  }

  const entries = SessionData.getEntries(guildId);

  if (!entries || entries.length === 0) {
    await message.reply("❌ No data to save.");
    return;
  }

  if (!session.parserType) {
    await message.reply(
      "❌ Couldn't detect data type.\nSend more data."
    );
    return;
  }

  // 🔥 MENU zamiast zapisu
  const menu = await buildEventSelectMenu(guildId);

  if (!menu) {
    await message.reply("❌ No events available.");
    return;
  }

  await message.reply({
    content: "📅 Select event to assign data:",
    components: [menu],
  });
}