// src/quickadd/commands/CancelCommand.ts

import { Message } from "discord.js";
import { SessionStore } from "../session/sessionStore"; // ✅ FIX

export async function cancel(message: Message) {
  const guildId = message.guildId!;
  const session = SessionStore.getSession(guildId); // ✅ FIX

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  // 🧹 usuń dane
  SessionStore.clearEntries(guildId); // ✅ FIX

  // 🧠 usuń sesję
  SessionStore.endSession(guildId); // ✅ FIX

  await message.reply("❌ Sesja została anulowana.");

  // 🗑️ usuń kanał sesji
  try {
    const channel = message.guild?.channels.cache.get(session.channelId);
    if (channel && channel.isTextBased()) {
      await channel.delete();
    }
  } catch (err) {
    console.error("Error deleting session channel:", err);
  }
}