import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";
import { processQuickAdd } from "../services/QuickAddService";

export async function confirm(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  const entries = SessionData.getEntries(guildId);

  if (!entries || entries.length === 0) {
    await message.reply("❌ Brak danych do zapisania.");
    return;
  }

  try {
    await processQuickAdd({
      parserType: session.parserType,
      entries,
      guildId,
    });

    await message.reply(`✅ Zapisano ${entries.length} wpisów!`);
  } catch (err) {
    console.error("Confirm error:", err);
    await message.reply("❌ Błąd podczas zapisu.");
    return;
  }

  SessionData.clear(guildId);
  SessionManager.endSession(guildId);

  setTimeout(async () => {
    try {
      const channel = await message.guild?.channels.fetch(session.channelId);
      await channel?.delete();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, 3000);
}