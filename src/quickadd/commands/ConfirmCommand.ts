import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

export async function confirm(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) return;

  const entries = SessionData.getEntries(guildId);

  if (!entries || entries.length === 0) {
    await message.reply("❌ Brak danych do zapisania.");
    return;
  }

  // 🔥 DEBUG (na razie zamiast Google Sheets)
  console.log("=== CONFIRM DATA ===");
  console.log(entries);

  await message.reply(
    `✅ Zapisano ${entries.length} wpisów!`
  );

  // 🧹 cleanup
  SessionData.clear(guildId);
  SessionManager.endSession(guildId);

  // 🗑️ usuwanie kanału
  setTimeout(async () => {
    try {
      const channel = await message.guild?.channels.fetch(session.channelId);
      await channel?.delete();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, 3000);
}