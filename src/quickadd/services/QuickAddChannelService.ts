import {
  Guild,
  TextChannel,
  ChannelType,
  EmbedBuilder,
} from "discord.js";

export async function createQuickAddChannel(
  guild: Guild
): Promise<TextChannel> {
  const existing = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.name === "quick-add"
  ) as TextChannel | undefined;

  if (existing) {
    await ensureInfoMessage(existing);
    return existing;
  }

  const channel = await guild.channels.create({
    name: "quick-add",
    type: ChannelType.GuildText,
  });

  await sendQuickAddInfo(channel);

  return channel;
}

// 📩 EMBED (w tym samym pliku)
async function sendQuickAddInfo(channel: TextChannel) {
  const embed = new EmbedBuilder()
    .setTitle("⚡ Kanał Quick Add")
    .setDescription(
      `To jest kanał startowy do dodawania danych.\n\n` +

      `📌 **Co możesz tutaj zrobić?**\n` +
      `• Rozpocząć sesję\n` +
      `• Wybrać typ danych\n\n` +

      `🧠 **Jak to działa?**\n` +
      `1️⃣ Wpisz komendę (np. \`!rradd\`)\n` +
      `2️⃣ Bot stworzy kanał sesji\n` +
      `3️⃣ Tam wpisujesz:\n` +
      `\`nick wartość\`\n\n` +

      `📌 Przykład:\n` +
      `\`Shadow 12.5M\`\n\n` +

      `━━━━━━━━━━━━━━━━━━\n` +
      `ℹ️ \`!help\` – lista komend`
    )
    .setColor(0x00b894);

  const msg = await channel.send({ embeds: [embed] });

  await msg.pin().catch(() => {});
}

// 🔒 żeby nie spamować embedów
async function ensureInfoMessage(channel: TextChannel) {
  try {
    const messages = await channel.messages.fetch({ limit: 10 });

    const hasEmbed = messages.some(
      (msg) =>
        msg.author.bot &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title?.includes("Quick Add")
    );

    if (!hasEmbed) {
      await sendQuickAddInfo(channel);
    }
  } catch (err) {
    console.error("QuickAdd ensureInfoMessage error:", err);
  }
}