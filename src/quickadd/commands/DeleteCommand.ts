import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

export async function deleteEntry(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

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

  const success = SessionData.removeEntry(guildId, index);

  // ❌ brak wpisu
  if (!success) {
    await message.reply("❌ Nie znaleziono wpisu.");
    return;
  }

  // ✅ sukces
  await message.reply(`🗑️ Usunięto wpis ${index + 1}.`);
}