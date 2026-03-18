import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

export async function adjust(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  const parts = message.content.trim().split(/\s+/);

  if (parts.length < 4) {
    await message.reply(
      "❌ Użycie: !adjust [id] [nick/value] [nowaWartość]"
    );
    return;
  }

  const index = Number(parts[1]) - 1;
  const field = parts[2].toLowerCase() as "nick" | "value";
  const newValue = parts.slice(3).join(" ");

  if (isNaN(index)) {
    await message.reply("❌ Niepoprawne ID.");
    return;
  }

  if (field !== "nick" && field !== "value") {
    await message.reply("❌ Dozwolone pola: nick, value.");
    return;
  }

  const success = SessionData.updateEntry(
    guildId,
    index,
    field,
    newValue
  );

  if (!success) {
    await message.reply("❌ Nie udało się zaktualizować wpisu.");
    return;
  }

  await message.reply(
    `✅ Wpis ${index + 1} zaktualizowany: ${field} → ${newValue}`
  );
}
