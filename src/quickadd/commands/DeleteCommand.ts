// src/quickadd/commands/DeleteCommand.ts

import { Message } from "discord.js";

// ✅ FIX: jeden store zamiast dwóch
import { SessionStore } from "../session/sessionStore";

export async function deleteEntry(message: Message) {
  const guildId = message.guildId!;
  const session = SessionStore.getSession(guildId);

  // ❌ brak sesji
  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  // 🔒 tylko owner
  if (session.moderatorId !== message.author.id) {
    await message.reply("❌ To nie Twoja sesja.");
    return;
  }

  const parts = message.content.trim().split(/\s+/);

  // ❌ brak ID
  if (parts.length < 2) {
    await message.reply("❌ Użycie: !delete [id]");
    return;
  }

  const index = Number(parts[1]) - 1;

  // ❌ niepoprawne ID
  if (isNaN(index)) {
    await message.reply("❌ Niepoprawne ID.");
    return;
  }

  // ✅ FIX
  const success = SessionStore.removeEntry(guildId, index);

  // ❌ brak wpisu
  if (!success) {
    await message.reply("❌ Nie znaleziono wpisu.");
    return;
  }

  // ✅ sukces
  await message.reply(`🗑️ Usunięto wpis ${index + 1}.`);
}