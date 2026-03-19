// src/quickadd/commands/ConfirmCommand.ts

import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";
import { processQuickAdd } from "../services/QuickAddService";

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

  try {
    // 🔥 KLUCZOWA ZMIANA
    await processQuickAdd({
      session,
      entries,
      guildId,
    });

    await message.reply(`✅ Saved ${entries.length} entries.`);
  } catch (err) {
    console.error("Confirm error:", err);

    await message.reply("❌ Failed to save data.");
    return;
  }

  // 🧹 cleanup
  SessionData.clear(guildId);
  SessionManager.endSession(guildId);

  // 🗑️ delete channel
  setTimeout(async () => {
    try {
      const channel = await message.guild?.channels.fetch(session.channelId);
      await channel?.delete();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, 3000);
}