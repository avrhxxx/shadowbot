// src/quickadd/commands/HelpCommand.ts
import { Message, EmbedBuilder } from "discord.js";
import { SessionManager } from "../session/SessionManager";

export async function help(message: Message) {
  const guildId = message.guildId!;
  const session = SessionManager.getSession(guildId);

  const isQuickAddChannel =
    message.channel.isTextBased() &&
    "name" in message.channel &&
    message.channel.name === "quick-add";

  // 🟦 QUICK ADD (start)
  if (!session && isQuickAddChannel) {
    const embed = new EmbedBuilder()
      .setTitle("📖 QuickAdd – Start")
      .setDescription(
        `🟦 **Rozpoczęcie sesji**\n` +
          `\`!rradd\` – Reservoir Raid (dodawanie danych)\n` +
          `\`!dnadd\` – Donations\n` +
          `\`!dpadd\` – Duel\n` +
          `\`!rrattend\` – attendance (obecność)\n\n` +
          `📌 Użyj jednej z komend, aby rozpocząć sesję.`
      )
      .setColor(0x5865f2);

    return message.reply({ embeds: [embed] });
  }

  // 🟨 SESJA
  if (session && message.channel.id === session.channelId) {
    const isAttend = session.mode === "attend";

    const embed = new EmbedBuilder()
      .setTitle("📖 QuickAdd – Sesja")
      .setDescription(
        `🟨 **Tryb:** ${isAttend ? "Attendance" : "Dodawanie danych"}\n\n` +
          `⚙️ **Podstawowe**\n` +
          `\`!preview\` – podgląd\n` +
          `\`!confirm\` – zapis i zakończenie\n` +
          `\`!cancel\` – anulowanie\n\n` +
          (!isAttend
            ? `🟩 **Edycja danych**\n` +
              `\`!adjust [id] nick [nowyNick]\`\n` +
              `\`!adjust [id] value [nowaWartość]\`\n` +
              `\`!delete [id]\`\n` +
              `\`!merge [fromId] [toId]\`\n\n`
            : `🟩 **Attendance**\n` +
              `Wpisuj po prostu:\n\`nick\`\n\n`) +
          `📌 Przykład:\n` +
          (!isAttend ? `\`!merge 2 1\`` : `\`Player123\``)
      )
      .setColor(0x57f287);

    return message.reply({ embeds: [embed] });
  }

  // ❌ inne miejsca
  return message.reply(
    "❌ Użyj `!help` w #quick-add lub w kanale sesji."
  );
}