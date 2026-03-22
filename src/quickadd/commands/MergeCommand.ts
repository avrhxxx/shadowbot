// src/quickadd/commands/MergeCommand.ts
import { Message } from "discord.js";
import { SessionManager } from "../session/SessionManager";
import { SessionData } from "../session/SessionData";

// 🔧 helper do formatowania (clean preview)
function formatValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${value}`;
}

export async function merge(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  // ❌ brak sesji
  if (!session) {
    await message.reply("❌ Brak aktywnej sesji.");
    return;
  }

  // 🔒 owner check
  if (session.moderatorId !== message.author.id) {
    await message.reply("❌ To nie Twoja sesja.");
    return;
  }

  const parts = message.content.trim().split(/\s+/);

  // ❌ brak argumentów
  if (parts.length < 3) {
    await message.reply("❌ Użycie: !merge [fromId] [toId]");
    return;
  }

  const fromIndex = Number(parts[1]) - 1;
  const toIndex = Number(parts[2]) - 1;

  // ❌ walidacja ID
  if (isNaN(fromIndex) || isNaN(toIndex)) {
    await message.reply("❌ Niepoprawne ID.");
    return;
  }

  if (fromIndex === toIndex) {
    await message.reply("❌ Nie możesz zmergować wpisu z samym sobą.");
    return;
  }

  const entries = SessionData.getEntries(guildId);

  if (!entries[fromIndex] || !entries[toIndex]) {
    await message.reply("❌ Nie znaleziono wpisu.");
    return;
  }

  const from = entries[fromIndex];
  const to = entries[toIndex];

  // 🔥 MERGE
  to.value += from.value;
  to.raw = formatValue(to.value);

  // 🗑️ USUŃ (ważne: większy index pierwszy)
  const first = Math.max(fromIndex, toIndex);
  const second = Math.min(fromIndex, toIndex);

  entries.splice(first, 1);

  // jeśli usunęliśmy element przed `toIndex`, to jego index się przesunął
  // ale ponieważ operujemy na referencji "to", to jest OK

  await message.reply(
    `🔗 Zmergowano wpis ${fromIndex + 1} → ${toIndex + 1}.`
  );
}