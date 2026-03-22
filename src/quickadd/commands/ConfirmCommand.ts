// src/quickadd/commands/ConfirmCommand.ts

import { Message } from "discord.js";
import { SessionStore } from "../session/sessionStore";

// ✅ IMPORT PIPELINE (ważne)
import { execute } from "../services/QuickAddPipeline";

export async function confirm(message: Message) {
  const guildId = message.guildId!;
  const session = SessionStore.getSession(guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  const entries = SessionStore.getEntries(guildId);

  if (!entries || entries.length === 0) {
    await message.reply("❌ Brak danych do zapisania.");
    return;
  }

  try {
    // 🔥 PRAWDZIWA LOGIKA
    await execute(session.parserType, entries, guildId);

    await message.reply(`✅ Zapisano ${entries.length} wpisów!`);
  } catch (err) {
    console.error("Confirm error:", err);
    await message.reply("❌ Błąd podczas zapisu.");
    return;
  }

  SessionStore.clearEntries(guildId);
  SessionStore.endSession(guildId);

  setTimeout(async () => {
    try {
      const channel = await message.guild?.channels.fetch(session.channelId);
      if (channel && "delete" in channel) {
        await channel.delete();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, 3000);
}